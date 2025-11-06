import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Armazenar localização do motorista em arquivo
const LOCATION_FILE = path.join(__dirname, 'driver-location.json');

// Inicializar arquivo de localização se não existir
if (!fs.existsSync(LOCATION_FILE)) {
  const defaultLocation = {
    latitude: -23.5505,
    longitude: -46.6333,
    accuracy: 0,
    city: 'São Paulo',
    region: 'São Paulo',
    country: 'Brazil',
    timestamp: new Date().toISOString(),
    source: 'default'
  };
  fs.writeFileSync(LOCATION_FILE, JSON.stringify(defaultLocation, null, 2));
}

// Rota para receber atualização de localização do motorista
app.post('/update-driver-location', async (req, res) => {
  try {
    const { latitude, longitude, accuracy, timestamp } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude e longitude são obrigatórias' });
    }

    // Buscar informações de cidade usando ip-api.com
    let city = 'Desconhecido';
    let region = 'Desconhecido';
    let country = 'Brazil';

    try {
      const response = await fetch(`http://ip-api.com/json/?fields=status,country,regionName,city&lat=${latitude}&lon=${longitude}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        city = data.city || 'Desconhecido';
        region = data.regionName || 'Desconhecido';
        country = data.country || 'Brazil';
      }
    } catch (error) {
      console.error('Erro ao obter informações de localização:', error);
    }

    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: parseFloat(accuracy) || 0,
      city,
      region,
      country,
      timestamp: timestamp || new Date().toISOString(),
      source: 'gps'
    };

    // Salvar em arquivo
    fs.writeFileSync(LOCATION_FILE, JSON.stringify(locationData, null, 2));

    console.log('📍 Localização do motorista atualizada:', locationData);

    res.json({ 
      success: true, 
      message: 'Localização atualizada com sucesso',
      location: locationData 
    });
  } catch (error) {
    console.error('Erro ao atualizar localização:', error);
    res.status(500).json({ error: 'Erro ao atualizar localização' });
  }
});

// Rota para obter localização atual do motorista
app.get('/get-driver-location', (req, res) => {
  try {
    const locationData = JSON.parse(fs.readFileSync(LOCATION_FILE, 'utf8'));
    res.json(locationData);
  } catch (error) {
    console.error('Erro ao ler localização:', error);
    res.status(500).json({ error: 'Erro ao obter localização' });
  }
});

// Servir a interface HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'driver-location.html'));
});

// Rota de status
app.get('/status', (req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor de localização rodando em http://localhost:${PORT}`);
  console.log(`📍 Acesse http://localhost:${PORT} para compartilhar localização do motorista`);
  console.log(`💾 Localização salva em: ${LOCATION_FILE}`);
});

export default app;