import { normalizeCategory } from './modules/common';
import { log } from './modules/logger';
import * as scrappers from './scrappers'

const cats = [
"NoCat",
"آموزش و پرورش",
"سیاسی",
"اجتماعی",
"ورزشی",
"فرهنگی",
"استانها",
"اقتصادی",
"ویدئو",
"استانها/کهگیلویه و بویراحمد",
"استانها/شهرستانهای تهران",
"استانها/خراسان رضوی",
"استانها/زنجان",
"استانها/قزوین",
"استانها/آذربایجان غربی",
"استانها/سیستان و بلوچستان",
"استانها/کردستان",
"استانها/خراسان جنوبی",
"استانها/آذربایجان شرقی",
"استانها/قم",
"استانها/بوشهر",
"استانها/البرز",
"استانها/مرکزی",
"رسانه‌های دیگر",
"اقتصادی/راه و مسکن",
"استانها/گلستان",
"استانها/اردبیل",
"استانها/خراسان شمالی",
"استانها/اصفهان",
"استانها/خوزستان",
"استانها/مازندران",
"استانها/فارس",
"استانها/گیلان",
"استانها/لرستان",
"آموزش و پرورش/مدرسه و دانش آموز",
"استانها/کرمانشاه",
"استانها/تهران",
"استانها/هرمزگان",
"استانها/سمنان",
"استانها/ایلام",
"اقتصادی/صنعت و تجارت",
"استانها/چهارمحال و بختیاری",
"آموزش و پرورش/نخبگان و فرهیختگان",
"استانها/همدان",
"استانها/کرمان",
"استانها/یزد",
"سیاسی/دولت",
"سیاسی/مجلس",
"آموزش و پرورش/تعلیم و تربیت",
"رسانه‌های دیگر/بازار",
"اجتماعی/شهری / رفاهی",
"اجتماعی/بهداشت",
"سیاسی/سیاست خارجی",
"اجتماعی/قضایی و انتظامی",
"اقتصادی/ارتباطات",
"اجتماعی/علمی و دانشگاهی",
"اجتماعی/حج و گردشگری",
"فرهنگی/رادیو و تلویزیون",
"اجتماعی/محیط زیست",
"فرهنگی/سینما و تئاتر",
"اقتصادی/نفت و انرژی",
"اقتصادی/اقتصاد کلان ،بانک و بیمه",
"اجتماعی/اخبار کرونا",
"اقتصادی/کشاورزی",
"سیاسی/دفاعی و امنیتی",
"سیاسی/امام و رهبری",
"فرهنگی/تجسمی و موسیقی",
"فرهنگی/ادبیات و نشر",
"اجتماعی/آسیب های اجتماعی",
"سیاسی/احزاب و شخصیت ها",
"سیاسی/انتخابات",
"فرهنگی/غدیر خم",
"فرهنگی/جشنواره فجر",
"آموزش و پرورش/خیرین مدرسه ساز",
"آموزش و پرورش/پرسش مهر",
"دانش‌ آموز خبرنگار",
"فرهنگی/پویش محرم",
"آموزش و پرورش/طرح 313",
"آموزش و پرورش/جنبش دانش آموزی کشور‌های اسلامی",
"عکس/عکس استان‌ها",
"آموزش و پرورش/راهیان پیشرفت",
"سیاسی/یوم الله 22 بهمن",
"آموزش و پرورش/زیارت اولی‌ها",
"آموزش و پرورش/پویش نوجوانان حسینی",
"آموزش و پرورش/اربعین حسینی",
"",

]
const scrapper = new scrappers.pana

for (const index in cats) {
    const mapped = scrapper.mapCategory(normalizeCategory(cats[index]))
    log.info(cats[index], mapped)
}