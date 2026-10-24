-- Notas olfativas de cada perfume (pirámide de Fragrantica): salida, corazón y fondo.
-- Formato: {"top": ["bergamota", ...], "heart": [...], "base": [...], "source": "https://..."}.
-- Algunos perfumes no tienen pirámide sino una sola lista: {"all": [...]}.
-- Vacío = la tienda no muestra la diapositiva de notas. Se comparte entre los tamaños de un perfume.
alter table products add column notes jsonb;
