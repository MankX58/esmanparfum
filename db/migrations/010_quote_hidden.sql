-- Cotizaciones ocultas: el administrador las saca de la lista principal cuando ya no necesita
-- verlas (por ejemplo, las ya respondidas). No se borran y se pueden volver a mostrar.
-- El cliente las sigue viendo en la tienda.
alter table quotes add column hidden_at timestamptz;
