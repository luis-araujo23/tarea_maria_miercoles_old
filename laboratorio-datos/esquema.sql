-- UJAP Split — PostgreSQL
-- Relación mínima pedida: PRODUCTO pertenece a CATEGORIA (1:N)
-- Más el núcleo del splitter: GASTO y GASTO_DIVISION (quién participa)

CREATE TABLE categoria (
  id     VARCHAR(40) PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  icono  VARCHAR(16) NOT NULL
);

CREATE TABLE producto (
  id           VARCHAR(40) PRIMARY KEY,
  categoria_id VARCHAR(40) NOT NULL,
  nombre       VARCHAR(120) NOT NULL,
  precio       NUMERIC(12, 2) NOT NULL CHECK (precio > 0),
  icono        VARCHAR(16) NOT NULL,
  CONSTRAINT fk_producto_categoria
    FOREIGN KEY (categoria_id) REFERENCES categoria (id)
);

CREATE TABLE companero (
  id     VARCHAR(40) PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL
);

CREATE TABLE gasto (
  id            SERIAL PRIMARY KEY,
  descripcion   VARCHAR(200) NOT NULL,
  monto         NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
  pagado_por_id VARCHAR(40) NOT NULL,
  producto_id   VARCHAR(40),
  fecha         DATE NOT NULL,
  tipo_division VARCHAR(20) NOT NULL CHECK (tipo_division IN ('igual', 'porcentaje', 'exacto')),
  CONSTRAINT fk_gasto_companero
    FOREIGN KEY (pagado_por_id) REFERENCES companero (id),
  CONSTRAINT fk_gasto_producto
    FOREIGN KEY (producto_id) REFERENCES producto (id)
);

CREATE TABLE gasto_division (
  gasto_id     INTEGER NOT NULL,
  companero_id VARCHAR(40) NOT NULL,
  valor        NUMERIC(12, 4) NOT NULL,
  PRIMARY KEY (gasto_id, companero_id),
  CONSTRAINT fk_division_gasto
    FOREIGN KEY (gasto_id) REFERENCES gasto (id),
  CONSTRAINT fk_division_companero
    FOREIGN KEY (companero_id) REFERENCES companero (id)
);

CREATE TABLE pago (
  id       SERIAL PRIMARY KEY,
  de_id    VARCHAR(40) NOT NULL,
  para_id  VARCHAR(40) NOT NULL,
  gasto_id INTEGER,
  monto    NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
  fecha    DATE NOT NULL,
  nota     VARCHAR(200),
  CONSTRAINT fk_pago_de
    FOREIGN KEY (de_id) REFERENCES companero (id),
  CONSTRAINT fk_pago_para
    FOREIGN KEY (para_id) REFERENCES companero (id),
  CONSTRAINT fk_pago_gasto
    FOREIGN KEY (gasto_id) REFERENCES gasto (id)
);
