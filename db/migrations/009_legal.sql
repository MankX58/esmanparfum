-- Prueba de la autorización de datos (Ley 1581 de 2012 y Decreto 1377 de 2013: quien trata
-- datos personales debe poder demostrar que el titular los autorizó).
-- Se guarda cuándo la persona aceptó los Términos y la Política de privacidad: al hacer un
-- pedido y al pedir una cotización. Las filas anteriores quedan vacías.
alter table orders add column terms_accepted_at timestamptz;
alter table quotes add column privacy_accepted_at timestamptz;
