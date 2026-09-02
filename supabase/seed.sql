-- 생성 파일 — 직접 수정하지 말 것. scripts/gen-seed.ts로 재생성.
-- 진실 소스: src/data/mock/regions.ts, src/data/mock/complexes.ts

truncate table complexes, regions restart identity cascade;

insert into regions (id, name, summary) values
  ('dongtan', '동탄2신도시', 'GTX·자족기능이 있는 남부 신도시'),
  ('misa', '미사강변도시', '한강 인접, 강남 접근성 좋은 동부'),
  ('gwanggyo', '광교신도시', '호수공원·학군의 수원 남부'),
  ('geomdan', '검단신도시', '신축 대단지가 많은 인천 북서부');

insert into complexes (
  id, region_id, name, price, sizes_pyeong, completion_year,
  households, station_distance_m, commute_minutes, metrics, school_nearby, images
) values
  ('dongtan-lake-xi', 'dongtan', '동탄레이크자이', '{"sale":{"representative":78000,"min":72000,"max":88000},"jeonse":{"representative":48000,"min":45000,"max":54000}}'::jsonb, '{25,34}', 2019, 1200, 350, '{"gangnam":55,"pangyo":45,"yeouido":70,"gwanghwamun":75,"jamsil":50,"magok":85,"guro-gasan":65}'::jsonb, '{"education":75,"infrastructure":70,"environment":80,"futurePotential":72}'::jsonb, true, NULL),
  ('dongtan-thesharp-central', 'dongtan', '동탄더샵센트럴', '{"sale":{"representative":92000,"min":86000,"max":105000},"jeonse":{"representative":57000,"min":53000,"max":65000}}'::jsonb, '{34,44}', 2021, 900, 500, '{"gangnam":55,"pangyo":45,"yeouido":70,"gwanghwamun":75,"jamsil":50,"magok":85,"guro-gasan":65}'::jsonb, '{"education":80,"infrastructure":78,"environment":75,"futurePotential":78}'::jsonb, true, NULL),
  ('dongtan-woonam', 'dongtan', '동탄우남퍼스트빌', '{"sale":{"representative":62000,"min":58000,"max":70000},"jeonse":{"representative":39000,"min":36000,"max":44000}}'::jsonb, '{24,32}', 2015, 1500, 800, '{"gangnam":55,"pangyo":45,"yeouido":70,"gwanghwamun":75,"jamsil":50,"magok":85,"guro-gasan":65}'::jsonb, '{"education":65,"infrastructure":60,"environment":70,"futurePotential":60}'::jsonb, false, NULL),
  ('misa-central', 'misa', '미사강변센트럴', '{"sale":{"representative":85000,"min":80000,"max":95000},"jeonse":{"representative":53000,"min":50000,"max":59000}}'::jsonb, '{25,34}', 2018, 1100, 400, '{"gangnam":40,"pangyo":55,"yeouido":50,"gwanghwamun":45,"jamsil":30,"magok":65,"guro-gasan":55}'::jsonb, '{"education":78,"infrastructure":82,"environment":76,"futurePotential":70}'::jsonb, true, NULL),
  ('misa-riverview', 'misa', '미사한강리버뷰', '{"sale":{"representative":99000,"min":92000,"max":115000},"jeonse":{"representative":62000,"min":57000,"max":71000}}'::jsonb, '{34,49}', 2020, 800, 600, '{"gangnam":40,"pangyo":55,"yeouido":50,"gwanghwamun":45,"jamsil":30,"magok":65,"guro-gasan":55}'::jsonb, '{"education":74,"infrastructure":75,"environment":85,"futurePotential":74}'::jsonb, true, NULL),
  ('misa-thesharp', 'misa', '미사더샵', '{"sale":{"representative":70000,"min":66000,"max":78000},"jeonse":{"representative":44000,"min":41000,"max":48000}}'::jsonb, '{23,29}', 2016, 1300, 900, '{"gangnam":40,"pangyo":55,"yeouido":50,"gwanghwamun":45,"jamsil":30,"magok":65,"guro-gasan":55}'::jsonb, '{"education":68,"infrastructure":70,"environment":72,"futurePotential":62}'::jsonb, false, NULL),
  ('gwanggyo-natureN-hills', 'gwanggyo', '광교자연앤힐스', '{"sale":{"representative":110000,"min":102000,"max":128000},"jeonse":{"representative":68000,"min":63000,"max":79000}}'::jsonb, '{34,45}', 2017, 1000, 450, '{"gangnam":50,"pangyo":35,"yeouido":65,"gwanghwamun":70,"jamsil":55,"magok":80,"guro-gasan":55}'::jsonb, '{"education":85,"infrastructure":80,"environment":88,"futurePotential":80}'::jsonb, true, NULL),
  ('gwanggyo-lakepark', 'gwanggyo', '광교레이크파크', '{"sale":{"representative":95000,"min":89000,"max":108000},"jeonse":{"representative":59000,"min":55000,"max":67000}}'::jsonb, '{29,34}', 2015, 700, 700, '{"gangnam":50,"pangyo":35,"yeouido":65,"gwanghwamun":70,"jamsil":55,"magok":80,"guro-gasan":55}'::jsonb, '{"education":82,"infrastructure":76,"environment":90,"futurePotential":76}'::jsonb, true, NULL),
  ('geomdan-paragon', 'geomdan', '검단파라곤', '{"sale":{"representative":55000,"min":51000,"max":62000},"jeonse":{"representative":34000,"min":32000,"max":38000}}'::jsonb, '{25,34}', 2022, 1400, 550, '{"gangnam":75,"pangyo":85,"yeouido":55,"gwanghwamun":60,"jamsil":80,"magok":40,"guro-gasan":50}'::jsonb, '{"education":62,"infrastructure":58,"environment":68,"futurePotential":66}'::jsonb, true, NULL),
  ('geomdan-prugio', 'geomdan', '검단신도시푸르지오', '{"sale":{"representative":60000,"min":56000,"max":67000},"jeonse":{"representative":37000,"min":35000,"max":42000}}'::jsonb, '{24,33}', 2023, 1600, 700, '{"gangnam":75,"pangyo":85,"yeouido":55,"gwanghwamun":60,"jamsil":80,"magok":40,"guro-gasan":50}'::jsonb, '{"education":64,"infrastructure":60,"environment":66,"futurePotential":70}'::jsonb, false, NULL);
