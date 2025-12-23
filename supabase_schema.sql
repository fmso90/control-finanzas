-- =============================================
-- Control de Finanzas - Esquema de Base de Datos
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Tabla de usuarios (para almacenar datos por usuario)
CREATE TABLE IF NOT EXISTS finanzas_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL DEFAULT '{"categorias":[],"ingresos":[],"gastosFijos":[],"gastosVariables":[],"meses":{}}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsqueda rápida por user_id
CREATE INDEX IF NOT EXISTS idx_finanzas_user_id ON finanzas_data(user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_finanzas_data_updated_at ON finanzas_data;
CREATE TRIGGER update_finanzas_data_updated_at
  BEFORE UPDATE ON finanzas_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Políticas de seguridad RLS (Row Level Security)
ALTER TABLE finanzas_data ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede leer/escribir sus propios datos (usando user_id como identificador)
CREATE POLICY "Users can manage their own data" ON finanzas_data
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Dar permisos a usuarios anónimos y autenticados
GRANT ALL ON finanzas_data TO anon;
GRANT ALL ON finanzas_data TO authenticated;
