import opencage from 'opencage-api-client';
import axios from 'axios';

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

  async geocodeAddressMultiple(address, limit = 5) {
    if (!process.env.OPENCAGE_API_KEY) {
      throw new Error('OPENCAGE_API_KEY não configurada');
    }

    try {
      const data = await opencage.geocode({
        q: address,
        language: 'pt',
        limit: limit,
        countrycode: 'br', // Priorizar resultados do Brasil
      });

      if (data.status.code === 200 && data.results.length > 0) {
        return data.results.map(result => ({
          latitude: result.geometry.lat,
          longitude: result.geometry.lng,
          formattedAddress: result.formatted,
          confidence: result.confidence,
          type: result.components._type,
        })).sort((a, b) => b.confidence - a.confidence); // Ordenar por confiança
      }

      return [];
    } catch (error) {
      console.error('Erro ao geocodificar endereço (múltiplas opções):', error.message);
      
      if (error.status && error.status.code === 402) {
        console.error('Limite diário da API OpenCage atingido');
      }
      
      throw error;
    }
  }

  async reverseGeocode(coords, limit = 5) {
    if (!process.env.OPENCAGE_API_KEY) {
      throw new Error('OPENCAGE_API_KEY não configurada');
    }

    try {
      const data = await opencage.geocode({
        q: `${coords.latitude},${coords.longitude}`,
        language: 'pt',
        limit: limit,
        no_annotations: 0, // Incluir anotações para mais contexto
      });

      if (data.status.code === 200 && data.results.length > 0) {
        return data.results.map(result => ({
          latitude: result.geometry.lat,
          longitude: result.geometry.lng,
          formattedAddress: result.formatted,
          confidence: result.confidence,
          type: result.components._type,
        })).sort((a, b) => b.confidence - a.confidence);
      }

      return [];
    } catch (error) {
      console.error('Erro ao fazer geocoding reverso:', error.message);
      
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

export default new GeocodingService();