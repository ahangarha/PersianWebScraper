import DatabaseConstructor, { Database } from 'better-sqlite3';
import { log } from './logger';
import { enuDomains } from './interfaces';
import { existsSync, mkdirSync, readdirSync, renameSync, statSync } from 'fs';
import gConfigs from './gConfigs';
import { Md5 } from 'ts-md5';
import { always, date2Gregorian } from './common';

export enum enuURLStatus {
    New = 'N',
    InProcess = 'I',
    Error = 'E',
    Discarded = 'D',
    Content = "C",
    Finished = 'F'
}

export default class clsDB {
    private db: Database
    private oldDB: Database
    private domain: enuDomains

    constructor(domain: enuDomains) {
        this.domain = domain
    }

    init() {
        if (!gConfigs.db)
            throw new Error("db config not set")

        if (!existsSync(gConfigs.db))
            if (!mkdirSync(gConfigs.db, { recursive: true }))
                throw new Error("Unable to create db directory: " + gConfigs.db)

        this.db = new DatabaseConstructor(`${gConfigs.db}/${this.domain}.new.db`, {
            verbose: (command) => log.db(command)
        });
        this.db.pragma('journal_mode = WAL');

        ['exit', 'SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(
            signal => process.on(signal, () => { log.info("Closing DB on exit"); try { this.db.close(); this.oldDB.close(); process.exit() } catch (e) {/**/ } })
        )

        this.db.exec(`CREATE TABLE IF NOT EXISTS tblURLs(
                'id' INTEGER PRIMARY KEY AUTOINCREMENT, 
                'url' TEXT NOT NULL UNIQUE, 
                'hash' TEXT NOT NULL UNIQUE,
                'creation' TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                'lastChange' TIMESTAMP DEFAULT NULL,
                'status' CHAR CHECK( status IN ('N','I','E', 'D', 'C', 'F') ) DEFAULT 'N',
                'wc' INTEGER DEFAULT 0,
                'docDate' TEXT DEFAULT NULL,
                'lastError' TEXT DEFAULT NULL
            )`)

        if (!this.hasAnyURL() && existsSync(`${gConfigs.db}/${this.domain}.db`)) {
            log.warn("moving old DB to new structure")
            let lastID = 0
            let count = 0
            this.oldDB = new DatabaseConstructor(`${gConfigs.db}/${this.domain}.db`, {
                verbose: (command) => log.db(command)
            });
            this.oldDB.pragma('journal_mode = WAL');

            try {
                const fileMap = {}
                const listAllFiles = (dir: string) => {
                    log.progress("loading " + dir)
                    const files = readdirSync(dir);

                    for (const file of files) {
                        const filePath = `${dir}/${file}`;
                        const fileStat = statSync(filePath);
                        if (fileStat.isDirectory())
                            listAllFiles(filePath);
                        else
                            fileMap[file.replace(".json", "")] = date2Gregorian(dir.split('/').at(-1))
                    }
                }

                log.info("Listing files")
                listAllFiles(gConfigs.corpora + "/" + this.domain)
                log.info(`There are ${Object.keys(fileMap).length} entries`)
                while (always) {
                    const orc: any = this.oldDB.prepare(`SELECT * FROM tblURLs WHERE id > ? LIMIT 1`).get(lastID)
                    if (orc) {
                        const insert = this.db.prepare(`INSERT OR IGNORE INTO tblURLs 
                                                        (url,hash,creation,lastChange,status,wc,docDate,lastError) 
                                                    VALUES (?  ,?   ,?       ,?         ,?     ,? ,?      ,?  )`)
                        const hash = Md5.hashStr(orc.url)
                        let docDate: string | undefined = undefined
                        if (orc.status === 'C') {
                            docDate = fileMap[hash]
                            if (!docDate || docDate === "IGNORED" || docDate === "NO_DATE")
                                docDate = "NOT_SET"

                            log.debug(`Inserting: ${orc.url} =>${hash}: ${docDate}`)
                        }

                        if (count % 1000 === 0)
                            log.progress(`Migration progress: (${this.domain})`, count, lastID)

                        insert.run(orc.url, hash, orc.creation, orc.lastChange, orc.status, orc.wc, docDate || null, orc.lastError)
                        lastID = orc.id
                        count++
                    } else
                        break
                }
                this.oldDB.close()
                log.progress('Moved from oldDB', count)
                const trashBin = gConfigs.db + "/trash"
                if (!existsSync(trashBin))
                    if (!mkdirSync(trashBin, { recursive: true }))
                        throw new Error("Unable to create trash directory: " + trashBin)
                renameSync(`${gConfigs.db}/${this.domain}.db`, `${trashBin}/${this.domain}.db`)
            } catch (e) {
                log.error(e)
                process.exit()
            }
        }
    }

    runQuery(query: string) {
        if (query.toUpperCase().startsWith("SELECT"))
            return this.db.prepare(query).all()
        else
            return this.db.prepare(query).run()
    }

    addToMustFetch(url: string) {
        const insert = this.db.prepare(`INSERT OR IGNORE INTO tblURLs (url, hash) VALUES (?,?)`)
        return insert.run(url, Md5.hashStr(url))
    }

    setStatus(id: number, status: enuURLStatus, err: string | null = null, wc: number | null = null, docDate: string | null = null) {
        this.db.prepare(`UPDATE tblURLs 
                                SET status = ?,
                                    lastError = ?,
                                    lastChange = strftime('%Y-%m-%d %H-%M-%S','now'),
                                    wc = ?,
                                    docDate = ?
                              WHERE id = ?`)
            .run(status, err, wc, docDate, id)
    }

    hasAnyURL() {
        return this.db.prepare(`SELECT 1 FROM tblURLs LIMIT 1`).get()
    }

    stats() {
        return this.db.prepare(`
            SELECT SUM(CASE WHEN(status = 'N') THEN 1 ELSE 0 END) AS remaining, 
                   SUM(1) AS total,
                   SUM(CASE WHEN(status = 'E') THEN 1 ELSE 0 END) AS error, 
                   SUM(CASE WHEN(status = 'D') THEN 1 ELSE 0 END) AS discarded, 
                   SUM(CASE WHEN(status = 'F' OR status = 'C') THEN 1 ELSE 0 END) AS processed,
                   SUM(CASE WHEN(status = 'C') THEN 1 ELSE 0 END) AS docs, 
                   SUM(wc) AS wc,
                   SUM(CASE WHEN(status = 'I') THEN 1 ELSE 0 END) AS fetching
              FROM tblURLs
        `).get()
    }

    reset() {
        return this.db.prepare(`UPDATE tblURLs 
                            SET status = 'N',
                                lastError = null,
                                lastChange = strftime('%Y-%m-%d %H-%M-%S','now')
                            WHERE status IN ('I','N')`)
            .run()
    }

    nextURL(status: enuURLStatus) {
        const select = this.db.prepare(`SELECT id, url 
                                          FROM tblURLs 
                                         WHERE status = ? 
                                           AND (
                                            lastError IS NULL 
                                            OR (status = 'E'
                                                AND lastError NOT LIKE '%code 400%' 
                                                AND lastError NOT LIKE '%code 403%' 
                                                AND lastError NOT LIKE '%code 404%' 
                                                AND lastError NOT LIKE '%code 414%' 
                                                AND lastError NOT LIKE 'Invalid date%'
                                            ))
                                         ORDER BY lastChange ASC, creation ASC
                                         LIMIT 1`)
        const update = this.db.prepare(`UPDATE tblURLs 
                                           SET status = 'I', 
                                               lastChange = strftime('%Y-%m-%d %H-%M-%S','now')
                                         WHERE id = ? `)
        let result: any
        const transaction = this.db.transaction(() => {
            result = select.get(status)
            if (result)
                update.run(result.id)
        })

        transaction()
        return result
    }

}

