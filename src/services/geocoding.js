const opencage = require('opencage-api-client');
const axios = require('axios');

class GeocodingService {
  async geocodeAddress(address) {
    if (!process.env.OPENCAGE_API_KEY) {
      throw new Error('OPENCAGE_API_KEY não configurada');
    }

    try {
      const data = await opencage.geocode({
        q: address,
        language: 'pt',
        limit: 1,
      });

      if (data.status.code === 200 && data.results.length > 0) {
        const result = data.results[0];
        return {
          latitude: result.geometry.lat,
          longitude: result.geometry.lng,
          formattedAddress: result.formatted,
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', error.message);
      
      if (error.status && error.status.code === 402) {
        console.error('Limite diário da API OpenCage atingido');
      }
      
      throw error;
    }
  }

  async getLocationFromIP(ip) {
    try {
      const response = await axios.get(`https://ipapi.co/${ip}/json/`);
      return {
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        city: response.data.city,
        region: response.data.region,
      };
    } catch (error) {
      console.error('Erro ao obter localização do IP:', error.message);
      return null;
    }
  }
}

module.exports = new GeocodingService();
