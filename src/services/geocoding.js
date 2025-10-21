const axios = require('axios');

class GeocodingService {
  constructor() {
    this.apiKey = process.env.OPENCAGE_API_KEY;
    this.baseUrl = 'https://api.opencagedata.com/geocode/v1/json';
  }

  async geocodeAddress(address) {
    if (!this.apiKey) {
      throw new Error('OPENCAGE_API_KEY não configurada');
    }

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          q: address,
          key: this.apiKey,
          language: 'pt',
          limit: 1,
        },
      });

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          latitude: result.geometry.lat,
          longitude: result.geometry.lng,
          formattedAddress: result.formatted,
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', error.message);
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
