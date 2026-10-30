-- ============================================================================
-- UJAP Split — Esquema Relacional PostgreSQL (Entrega 3)
-- Modelado completo del corazón de datos de la aplicación
-- ============================================================================

-- 1. Tabla: usuario (Cuentas del sistema / Autenticación)
CREATE TABLE usuario (
  id          VARCHAR(40) PRIMARY KEY,
  nombre      VARCHAR(80) NOT NULL,
  apellido    VARCHAR(80) NOT NULL DEFAULT '',
  email       VARCHAR(120) NOT NULL UNIQUE,
  clave       VARCHAR(255) NOT NULL,
  rol         VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'usuario')),
  creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla: companero (Participantes en la división de gastos del grupo)
--    Relación 1 a 1 / 1 a N con usuario (opcional si es usuario registrado)
CREATE TABLE companero (
  id          VARCHAR(40) PRIMARY KEY,
  usuario_id  VARCHAR(40),
  nombre      VARCHAR(80) NOT NULL,
  CONSTRAINT fk_companero_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE SET NULL
);

-- 3. Tabla: categoria (Categorías de materiales de estudio)
CREATE TABLE categoria (
  id          VARCHAR(40) PRIMARY KEY,
  nombre      VARCHAR(80) NOT NULL,
  icono       VARCHAR(16) NOT NULL
);

-- 4. Tabla: producto (Catálogo de materiales y productos universitarios)
--    Relación N a 1 con categoria
CREATE TABLE producto (
  id           VARCHAR(40) PRIMARY KEY,
  categoria_id VARCHAR(40) NOT NULL,
  nombre       VARCHAR(120) NOT NULL,
  precio       NUMERIC(12, 2) NOT NULL CHECK (precio > 0),
  icono        VARCHAR(16) NOT NULL,
  CONSTRAINT fk_producto_categoria
    FOREIGN KEY (categoria_id) REFERENCES categoria (id) ON DELETE RESTRICT
);

-- 5. Tabla: gasto (Registro principal de gastos / compras realizadas)
--    Relación N a 1 con companero (quién pagó) y con producto (opcional)
CREATE TABLE gasto (
  id            SERIAL PRIMARY KEY,
  descripcion   VARCHAR(200) NOT NULL,
  monto         NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
  pagado_por_id VARCHAR(40) NOT NULL,
  producto_id   VARCHAR(40),
  fecha         DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo_division VARCHAR(20) NOT NULL CHECK (tipo_division IN ('igual', 'porcentaje', 'exacto')),
  CONSTRAINT fk_gasto_companero
    FOREIGN KEY (pagado_por_id) REFERENCES companero (id) ON DELETE RESTRICT,
  CONSTRAINT fk_gasto_producto
    FOREIGN KEY (producto_id) REFERENCES producto (id) ON DELETE SET NULL
);

-- 6. Tabla: gasto_division (Tabla intermedia N a N: quiénes participan en cada gasto)
CREATE TABLE gasto_division (
  gasto_id     INTEGER NOT NULL,
  companero_id VARCHAR(40) NOT NULL,
  valor        NUMERIC(12, 4) NOT NULL CHECK (valor >= 0),
  PRIMARY KEY (gasto_id, companero_id),
  CONSTRAINT fk_division_gasto
    FOREIGN KEY (gasto_id) REFERENCES gasto (id) ON DELETE CASCADE,
  CONSTRAINT fk_division_companero
    FOREIGN KEY (companero_id) REFERENCES companero (id) ON DELETE RESTRICT
);

-- 7. Tabla: pago (Abonos o liquidaciones de deudas entre compañeros)
CREATE TABLE pago (
  id       SERIAL PRIMARY KEY,
  de_id    VARCHAR(40) NOT NULL,
  para_id  VARCHAR(40) NOT NULL,
  gasto_id INTEGER,
  monto    NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
  fecha    DATE NOT NULL DEFAULT CURRENT_DATE,
  nota     VARCHAR(200),
  CONSTRAINT fk_pago_de
    FOREIGN KEY (de_id) REFERENCES companero (id) ON DELETE RESTRICT,
  CONSTRAINT fk_pago_para
    FOREIGN KEY (para_id) REFERENCES companero (id) ON DELETE RESTRICT,
  CONSTRAINT fk_pago_gasto
    FOREIGN KEY (gasto_id) REFERENCES gasto (id) ON DELETE SET NULL,
  CONSTRAINT chk_pago_distintos_participantes
    CHECK (de_id <> para_id)
);

-- Índices recomendados para optimización de consultas frecuentes
CREATE INDEX idx_producto_categoria ON producto (categoria_id);
CREATE INDEX idx_gasto_pagado_por ON gasto (pagado_por_id);
CREATE INDEX idx_gasto_fecha ON gasto (fecha);
CREATE INDEX idx_division_companero ON gasto_division (companero_id);
CREATE INDEX idx_pago_de_para ON pago (de_id, para_id);
