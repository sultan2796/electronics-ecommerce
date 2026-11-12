type Text = { az: string; ru: string };

export interface ProductTranslation {
  name?: Text;
  description: Text;
}

export const productTranslations: Record<string, ProductTranslation> = {
  "DJ-112": {
    name: { az: "TV studiya kamera postamenti", ru: "Студийный пьедестал для ТВ-камеры" },
    description: {
      az: "TV studiya kamera postamenti studiyada kameranın hamar və dəqiq hərəkəti üçün peşəkar dayaq sistemidir. Yayım və istehsal üçün idealdır.",
      ru: "Студийный пьедестал для ТВ-камеры — профессиональная система опоры для плавного и точного перемещения камеры в студии. Идеален для вещания и продакшна.",
    },
  },
  "DJ-111": {
    name: { az: "Selfi çubuğu monopod", ru: "Монопод-селфи-палка" },
    description: {
      az: "Selfi çubuğu monopod mükəmməl selfi və ya qrup fotosu çəkmək üçün uzanan və qatlanan cihazdır. Smartfonlar və kameralarla uyğundur.",
      ru: "Монопод-селфи-палка — раздвижное и складное устройство для идеальных селфи и групповых фото. Совместим со смартфонами и камерами.",
    },
  },
  "DJ-110": {
    name: { az: "iPhone üçün selfi lampası", ru: "Селфи-лампа для iPhone" },
    description: {
      az: "iPhone üçün selfi lampası selfiləri və video zəngləri yaxşılaşdıran portativ və tənzimlənən LED işıqdır. İşıqlı fotolar üçün iPhone-a bərkidin.",
      ru: "Селфи-лампа для iPhone — портативная регулируемая LED-подсветка для селфи и видеозвонков. Крепится к iPhone для хорошо освещённых фото.",
    },
  },
  "DJ-109": {
    name: { az: "Monopod", ru: "Монопод" },
    description: {
      az: "Monopod sabit və tənzimlənən çəkiliş üçün çoxfunksiyalı kamera aksesuarıdır. Selfi, qrup fotosu və videoları asanlıqla çəkmək üçün idealdır.",
      ru: "Монопод — универсальный аксессуар для стабильной и регулируемой съёмки. Идеален для селфи, групповых фото и видео.",
    },
  },
  "DJ-108": {
    name: { az: "iPhone 12 MagSafe silikon örtüyü, gavalı rəngi", ru: "Силиконовый чехол MagSafe для iPhone 12, сливовый" },
    description: {
      az: "Gavalı rəngli MagSafe silikon örtüyü iPhone 12 üçün hazırlanmış zövqlü və qoruyucu örtükdür. Aksesuarları asanlıqla bərkitmək üçün MagSafe texnologiyası var.",
      ru: "Силиконовый чехол MagSafe сливового цвета — стильный и защитный чехол для iPhone 12. Технология MagSafe позволяет легко крепить аксессуары.",
    },
  },
  "DJ-107": {
    name: { az: "Beats Flex simsiz qulaqlıqları", ru: "Беспроводные наушники Beats Flex" },
    description: {
      az: "Beats Flex simsiz qulaqlıqları rahat və çoxyönlü səs təcrübəsi təqdim edir. Maqnitli qulaqlıqlar və 12 saata qədər batareya ilə gündəlik istifadə üçün idealdır.",
      ru: "Беспроводные наушники Beats Flex обеспечивают удобный и универсальный звук. Магнитные вкладыши и до 12 часов работы — идеально на каждый день.",
    },
  },
  "DJ-106": {
    name: { az: "Apple Watch Series 4, qızılı", ru: "Apple Watch Series 4, золотые" },
    description: {
      az: "Qızılı rəngli Apple Watch Series 4 ürək döyüntüsünün izlənməsi, fitnes izləmə və gözəl Retina ekranı olan zövqlü və müasir ağıllı saatdır.",
      ru: "Apple Watch Series 4 золотого цвета — стильные умные часы с контролем пульса, фитнес-трекингом и красивым дисплеем Retina.",
    },
  },
  "DJ-105": {
    name: { az: "Apple MagSafe batareya bloku", ru: "Аккумулятор Apple MagSafe" },
    description: {
      az: "Apple MagSafe batareya bloku MagSafe dəstəkli iPhone-a əlavə batareya ömrü verən portativ və rahat həlldir. Etibarlı bağlantı üçün maqnitlə bərkidilir.",
      ru: "Аккумулятор Apple MagSafe — портативный способ продлить работу iPhone с поддержкой MagSafe. Крепится магнитом для надёжного соединения.",
    },
  },
  "DJ-104": {
    name: { az: "Apple iPhone adapteri", ru: "Зарядное устройство Apple для iPhone" },
    description: {
      az: "Apple iPhone adapteri iPhone-u sürətli və səmərəli şarj etmək üçün hazırlanmış yüksək keyfiyyətli şarj cihazıdır. Cihazınız həmişə şarjlı və hazır olsun.",
      ru: "Зарядное устройство Apple — качественный адаптер для быстрой и эффективной зарядки iPhone. Ваше устройство всегда заряжено и готово к работе.",
    },
  },
  "DJ-103": {
    name: { az: "Apple HomePod Mini, kosmik boz", ru: "Apple HomePod Mini, серый космос" },
    description: {
      az: "Kosmik boz rəngli Apple HomePod Mini təsirli səs verən və Apple ekosisteminə asanlıqla inteqrasiya olunan kompakt ağıllı dinamikdir.",
      ru: "Apple HomePod Mini цвета «серый космос» — компактная умная колонка с впечатляющим звуком и простой интеграцией в экосистему Apple.",
    },
  },
  "DJ-102": {
    name: { az: "Apple AirPower simsiz şarj cihazı", ru: "Беспроводная зарядка Apple AirPower" },
    description: {
      az: "Apple AirPower simsiz şarj cihazı uyğun Apple cihazlarını simsiz şarj etməyin rahat yoludur. Cihazlarınızı sadəcə şarj altlığına qoyun.",
      ru: "Беспроводная зарядка Apple AirPower — удобный способ заряжать совместимые устройства Apple. Просто положите их на коврик.",
    },
  },
  "DJ-101": {
    name: { az: "Apple AirPods Max, gümüşü", ru: "Apple AirPods Max, серебристые" },
    description: {
      az: "Gümüşü Apple AirPods Max yüksək keyfiyyətli səs, adaptiv ekvalayzer və aktiv səs-küy azaltma ilə premium qulaqüstü qulaqlıqdır.",
      ru: "Apple AirPods Max серебристого цвета — премиальные полноразмерные наушники с Hi-Fi звуком, адаптивным эквалайзером и активным шумоподавлением.",
    },
  },
  "DJ-100": {
    name: { az: "Apple AirPods", ru: "Apple AirPods" },
    description: {
      az: "Apple AirPods rahat simsiz səs təcrübəsi təqdim edir. Asan qoşulma, keyfiyyətli səs və Siri inteqrasiyası ilə yolda dinləmək üçün idealdır.",
      ru: "Apple AirPods — удобный беспроводной звук: простое подключение, качественное звучание и интеграция с Siri. Идеальны в дороге.",
    },
  },
  "DJ-99": {
    description: {
      az: "Amazon Echo Plus daxili Alexa səs idarəsi olan ağıllı dinamikdir. Premium səs keyfiyyəti var və ağıllı ev cihazlarını idarə etmək üçün mərkəz rolunu oynayır.",
      ru: "Amazon Echo Plus — умная колонка со встроенным голосовым помощником Alexa. Премиальный звук и функция хаба для управления умным домом.",
    },
  },
  "DJ-161": {
    name: { az: "Samsung Galaxy Tab, ağ", ru: "Samsung Galaxy Tab, белый" },
    description: {
      az: "Ağ rəngli Samsung Galaxy Tab zərif və çoxfunksiyalı Android planşetidir. Parlaq ekran, uzunömürlü batareya və geniş imkanlarla müxtəlif işlər üçün əla seçimdir.",
      ru: "Samsung Galaxy Tab белого цвета — изящный и универсальный Android-планшет. Яркий экран, долгая автономность и множество функций.",
    },
  },
  "DJ-160": {
    name: { az: "Samsung Galaxy Tab S8 Plus, boz", ru: "Samsung Galaxy Tab S8 Plus, серый" },
    description: {
      az: "Boz rəngli Samsung Galaxy Tab S8 Plus yüksək performanslı Android planşetidir. Böyük AMOLED ekran, güclü prosessor və S Pen dəstəyi ilə iş və əyləncə üçün idealdır.",
      ru: "Samsung Galaxy Tab S8 Plus серого цвета — производительный Android-планшет с большим AMOLED-экраном, мощным процессором и поддержкой S Pen.",
    },
  },
  "DJ-159": {
    name: { az: "iPad Mini 2021, Starlight", ru: "iPad Mini 2021, «сияющая звезда»" },
    description: {
      az: "Starlight rəngli iPad Mini 2021 Apple-ın kompakt və güclü planşetidir. Retina ekran, güclü A-seriya çipi və zərif dizaynla premium təcrübə verir.",
      ru: "iPad Mini 2021 цвета «сияющая звезда» — компактный и мощный планшет Apple с дисплеем Retina, чипом A-серии и элегантным дизайном.",
    },
  },
  "DJ-82": {
    name: { az: "Yeni DELL XPS 13 9300 noutbuku", ru: "Новый ноутбук DELL XPS 13 9300" },
    description: {
      az: "Yeni DELL XPS 13 9300 demək olar ki, çərçivəsiz InfinityEdge ekranı və yüksək performansı olan kompakt və güclü noutbukdur.",
      ru: "Новый DELL XPS 13 9300 — компактный и мощный ноутбук с практически безрамочным дисплеем InfinityEdge и высокой производительностью.",
    },
  },
  "DJ-81": {
    description: {
      az: "Lenovo Yoga 920 çevik menteşəli 2-si 1-də transformasiya olunan noutbukdur; onu həm noutbuk, həm planşet kimi istifadə etmək olar.",
      ru: "Lenovo Yoga 920 — ноутбук-трансформер 2-в-1 с гибким шарниром: его можно использовать как ноутбук или как планшет.",
    },
  },
  "DJ-80": {
    description: {
      az: "Huawei Matebook X Pro yüksək dəqiqlikli sensor ekranı olan nazik və zövqlü noutbukdur, yolda olanlar üçün premium təcrübə təqdim edir.",
      ru: "Huawei Matebook X Pro — тонкий и стильный ноутбук с сенсорным экраном высокого разрешения для работы в дороге.",
    },
  },
  "DJ-79": {
    name: { az: "Asus Zenbook Pro iki ekranlı noutbuk", ru: "Ноутбук Asus Zenbook Pro с двумя экранами" },
    description: {
      az: "Asus Zenbook Pro iki ekranlı noutbuku yaradıcı peşəkarlar üçün məhsuldarlıq və çevik iş imkanı verən yüksək performanslı cihazdır.",
      ru: "Asus Zenbook Pro с двумя экранами — производительный ноутбук, дающий творческим профессионалам больше продуктивности и гибкости.",
    },
  },
  "DJ-78": {
    name: { az: "Apple MacBook Pro 14 düym, kosmik boz", ru: "Apple MacBook Pro 14 дюймов, серый космос" },
    description: {
      az: "Kosmik boz MacBook Pro 14 düym Apple M1 Pro çipi ilə müstəsna performans və heyrətamiz Retina ekranı olan güclü və zərif noutbukdur.",
      ru: "MacBook Pro 14 дюймов цвета «серый космос» — мощный и элегантный ноутбук с чипом Apple M1 Pro и потрясающим дисплеем Retina.",
    },
  },
  "DJ-136": {
    description: {
      az: "Vivo X21 qabaqcıl texnologiyalara fokuslanan premium smartfondur. Ekranaltı barmaq izi sensoru, yüksək dəqiqlikli ekran və güclü kamera imkanları var.",
      ru: "Vivo X21 — премиальный смартфон с передовыми технологиями: подэкранный сканер отпечатков, экран высокого разрешения и продвинутая камера.",
    },
  },
  "DJ-135": {
    description: {
      az: "Vivo V9 zərif dizaynı və keyfiyyətli selfiləri ilə tanınan smartfondur. Çentikli ekran, ikili kamera və müasir dizayna malikdir.",
      ru: "Vivo V9 — смартфон с изящным дизайном и упором на качественные селфи. Экран с вырезом, двойная камера и современный дизайн.",
    },
  },
  "DJ-134": {
    description: {
      az: "Vivo S1 dizayn və performansı birləşdirən zövqlü orta seqment smartfondur. Parlaq ekran, bacarıqlı kamera və etibarlı işləmə təqdim edir.",
      ru: "Vivo S1 — стильный смартфон среднего класса, сочетающий дизайн и производительность: яркий экран, хорошая камера и надёжная работа.",
    },
  },
  "DJ-133": {
    description: {
      az: "Samsung Galaxy S10 dinamik AMOLED ekranı, çoxfunksiyalı kamera sistemi və güclü performansı olan flaqman cihazdır. Smartfon texnologiyasında innovasiyanı təmsil edir.",
      ru: "Samsung Galaxy S10 — флагман с экраном Dynamic AMOLED, универсальной системой камер и высокой производительностью.",
    },
  },
  "DJ-132": {
    description: {
      az: "Samsung Galaxy S8 Infinity ekranı ilə heyrətamiz vizual təcrübə verən premium smartfondur. Qabaqcıl kamera imkanları və müasir texnologiyaya malikdir.",
      ru: "Samsung Galaxy S8 — премиальный смартфон с экраном Infinity Display, продвинутой камерой и передовыми технологиями.",
    },
  },
  "DJ-131": {
    description: {
      az: "Samsung Galaxy S7 zərif dizaynı və qabaqcıl funksiyaları ilə tanınan flaqman smartfondur. Yüksək dəqiqlikli ekran, güclü kamera və möhkəm performans təqdim edir.",
      ru: "Samsung Galaxy S7 — флагманский смартфон с изящным дизайном, экраном высокого разрешения, мощной камерой и надёжной производительностью.",
    },
  },
  "DJ-130": {
    description: {
      az: "Realme XT kamera texnologiyasına fokuslanan zəngin funksiyalı smartfondur. Qabaqcıl kamera sensorları ilə foto həvəskarları üçün keyfiyyətli şəkil və videolar çəkir.",
      ru: "Realme XT — функциональный смартфон с упором на камеру: продвинутые сенсоры дают качественные фото и видео для любителей съёмки.",
    },
  },
  "DJ-129": {
    description: {
      az: "Realme X zərif dizaynı və təsirli ekranı ilə tanınan orta seqment smartfondur. Keyfiyyətli cihaz axtaranlar üçün performans və kamera arasında yaxşı balans təklif edir.",
      ru: "Realme X — смартфон среднего класса с изящным дизайном и впечатляющим экраном, хороший баланс производительности и камеры.",
    },
  },
  "DJ-128": {
    description: {
      az: "Realme C35 gündəlik istifadə üçün əsas funksiyaları təqdim edən büdcəyə uyğun smartfondur. Etibarlı performans və rahat istifadə təklif edir.",
      ru: "Realme C35 — доступный смартфон с основными функциями на каждый день, надёжной работой и удобством использования.",
    },
  },
  "DJ-127": {
    description: {
      az: "Oppo K1 seriyası müxtəlif funksiya və xüsusiyyətlərə malik smartfonlar təklif edir. Zövqlü dizayn və etibarlı performansı ilə müxtəlif istifadəçi tələblərinə cavab verir.",
      ru: "Серия Oppo K1 предлагает смартфоны с разными характеристиками, стильным дизайном и надёжной производительностью для разных пользователей.",
    },
  },
  "DJ-126": {
    description: {
      az: "Oppo F19 Pro Plus kamera imkanlarına fokuslanan zəngin funksiyalı smartfondur. Qabaqcıl foto funksiyaları və güclü performansla premium təcrübə verir.",
      ru: "Oppo F19 Pro Plus — функциональный смартфон с упором на камеру: продвинутые функции съёмки и высокая производительность.",
    },
  },
  "DJ-125": {
    description: {
      az: "Oppo A57 zərif dizaynı və bacarıqlı funksiyaları ilə tanınan orta seqment smartfondur. Performans və münasib qiymət balansı ilə populyar seçimdir.",
      ru: "Oppo A57 — смартфон среднего класса с изящным дизайном и хорошими функциями, популярный за баланс производительности и цены.",
    },
  },
  "DJ-124": {
    description: {
      az: "iPhone X çərçivəsiz OLED ekranı, üz tanıma texnologiyası (Face ID) və təsirli performansı olan flaqman smartfondur. iPhone dizaynında mühüm mərhələdir.",
      ru: "iPhone X — флагман с безрамочным OLED-экраном, распознаванием лица Face ID и впечатляющей производительностью; веха в дизайне iPhone.",
    },
  },
  "DJ-123": {
    description: {
      az: "iPhone 13 Pro güclü kamera sistemi, yüksək performanslı çip və heyrətamiz ekranı olan qabaqcıl smartfondur. Ən yaxşı texnologiyanı istəyənlər üçündür.",
      ru: "iPhone 13 Pro — передовой смартфон с мощной системой камер, производительным чипом и потрясающим экраном для требовательных пользователей.",
    },
  },
  "DJ-122": {
    description: {
      az: "iPhone 6 daha böyük ekranı və yaxşılaşdırılmış performansı olan zövqlü və bacarıqlı smartfondur. Öz dövründə yeni funksiyalar və dizayn gətirmişdi.",
      ru: "iPhone 6 — стильный смартфон с увеличенным экраном и улучшенной производительностью, в своё время принёсший новые функции и дизайн.",
    },
  },
  "DJ-121": {
    description: {
      az: "iPhone 5s kompakt dizaynı və buraxıldığı dövrün qabaqcıl funksiyaları ilə tanınan klassik smartfondur. Köhnə model olsa da, etibarlı təcrübə təqdim edir.",
      ru: "iPhone 5s — классический компактный смартфон с передовыми для своего времени функциями. Хотя модель старая, она по-прежнему надёжна.",
    },
  },
};

export const categoryTranslations: Record<string, { az: string; ru: string; en: string }> = {
  smartphones: { az: "Smartfonlar", ru: "Смартфоны", en: "Smartphones" },
  laptops: { az: "Noutbuklar", ru: "Ноутбуки", en: "Laptops" },
  tablets: { az: "Planşetlər", ru: "Планшеты", en: "Tablets" },
  "mobile-accessories": { az: "Mobil aksesuarlar", ru: "Мобильные аксессуары", en: "Mobile accessories" },
  headsets: { az: "Qulaqlıqlar", ru: "Наушники", en: "Headsets" },
  earphones: { az: "Qulaqcıqlar", ru: "Вкладыши", en: "Earphones" },
  cables: { az: "Kabellər", ru: "Кабели", en: "Cables" },
  monitors: { az: "Monitorlar", ru: "Мониторы", en: "Monitors" },
  desktops: { az: "Masaüstü kompüterlər", ru: "Настольные компьютеры", en: "Desktops" },
};
