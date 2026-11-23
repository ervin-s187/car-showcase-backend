const express = require('express');
const cors = require('cors');
const db = require('./database');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const databaseRoute = (message, handler) => (req, res) => {
  try {
    return handler(req, res);
  } catch (error) {
    console.error(message, error);
    return res.status(500).json({ error: message });
  }
};

function carId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid car ID.' });
    return null;
  }
  return id;
}

function validateCar(body) {
  const { brand, model, year, price } = body;
  if (typeof brand !== 'string' || !brand.trim() ||
      typeof model !== 'string' || !model.trim() ||
      year === undefined || year === null || year === '' ||
      price === undefined || price === null || price === '') {
    return { error: 'Brand, model, year and price are required.' };
  }

  const carYear = Number(year);
  const carPrice = Number(price);
  if (!Number.isInteger(carYear) || carYear < 1886 ||
    carYear > new Date().getFullYear() + 1 ||
    !Number.isFinite(carPrice) ||
    carPrice < 0) {
    return { error: 'Invalid year or price.' };
  }
  return { carYear, carPrice };
}

function carValues(body, carYear, carPrice) {
  return [
    body.brand.trim(),
    body.model.trim(),
    carYear, carPrice,
    body.horsepower || null,
    body.fuel || null,
    body.transmission || null,
    body.image || null,
  ];
}

app.get('/api/cars', databaseRoute('Failed to retrieve cars.', (req, res) =>
  res.status(200).json(db.prepare('SELECT * FROM cars').all())
));

app.get('/api/cars/:id', databaseRoute('Failed to retrieve car.', (req, res) => {
  const id = carId(req, res);
  if (id === null) return;
  const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(id);
  if (!car) {
    return res.status(404).json({ error: 'Car not found.' });
  }
  return res.status(200).json(car);
}));

app.post('/api/cars', databaseRoute('Failed to add car.', (req, res) => {
  const validation = validateCar(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }
  const result = db.prepare(`
    INSERT INTO cars (brand, model, year, price, horsepower, fuel, transmission, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(...carValues(req.body, validation.carYear, validation.carPrice));
  return res.status(201).json({
    message: 'Car added successfully!',
    id: result.lastInsertRowid,
  });
}));

app.put('/api/cars/:id', databaseRoute('Failed to update car.', (req, res) => {
  const id = carId(req, res);
  if (id === null) return;
  const validation = validateCar(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }
  const result = db.prepare(`
    UPDATE cars
    SET brand = ?, model = ?, year = ?, price = ?, horsepower = ?,
        fuel = ?, transmission = ?, image = ?
    WHERE id = ?
  `).run(...carValues(req.body, validation.carYear, validation.carPrice), id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Car not found.' });
  }
  return res.status(200).json({ message: 'Car updated successfully!' });
}));

app.delete('/api/cars/:id', databaseRoute('Failed to delete car.', (req, res) => {
  const id = carId(req, res);
  if (id === null) return;
  const result = db.prepare('DELETE FROM cars WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Car not found.' });
  }
  return res.status(200).json({ message: 'Car deleted successfully!' });
}));

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});
