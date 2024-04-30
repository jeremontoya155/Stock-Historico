const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configuración de la conexión a la base de datos
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

// Ruta raíz para servir el archivo index.html desde la carpeta public
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint para consultar el stock acumulado
app.get('/stock', (req, res) => {
  // Obtener parámetros desde la URL
  const fecha_desde = req.query.fecha_desde;
  const fecha_hasta = req.query.fecha_hasta;
  const sucursal = req.query.sucursal;
  const idproducto = req.query.idproducto;

  // Consulta SQL para obtener el stock acumulado
  const sqlQuery = `
    SELECT 
      s.sucursal,
      d.fecha,
      s.idproducto,
      'S' AS tipomovimiento,
      SUM(
          CASE WHEN m.fecha <= d.fecha THEN m.cantidad ELSE 0 END
      ) AS cantidad_acumulada
    FROM (
        SELECT DISTINCT fecha
        FROM stockmovimientos
        WHERE fecha BETWEEN ? AND ?
    ) AS d
    CROSS JOIN stock AS s  
    LEFT JOIN stockmovimientos AS m ON s.sucursal = m.sucursal
        AND s.idproducto = m.idproducto
        AND m.fecha <= d.fecha
    WHERE s.idproducto = ? AND s.sucursal = ?
    GROUP BY s.sucursal, d.fecha, s.idproducto
    ORDER BY d.fecha;
  `;

  // Ejecutar la consulta SQL
  connection.query(sqlQuery, [fecha_desde, fecha_hasta, idproducto, sucursal], (error, results) => {
    if (error) {
      res.status(500).json({ error: 'Error al ejecutar la consulta' });
      return;
    }

    res.json(results);
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
