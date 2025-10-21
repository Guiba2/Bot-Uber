const axios = require('axios');

class RoutingService {
  constructor() {
    this.apiKey = process.env.OPENROUTESERVICE_API_KEY;
    this.baseUrl = 'https://api.openrouteservice.org/v2/directions/driving-car';
  }

  async calculateRoute(originCoords, destinationCoords) {
    if (!this.apiKey) {
      throw new Error('OPENROUTESERVICE_API_KEY não configurada');
    }

    try {
      const response = await axios.post(
        this.baseUrl,
        {
          coordinates: [
            [originCoords.longitude, originCoords.latitude],
            [destinationCoords.longitude, destinationCoords.latitude],
          ],
        },
        {
          headers: {
            'Authorization': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      const route = response.data.routes[0];
      const summary = route.summary;

      return {
        distance: (summary.distance / 1000).toFixed(2),
        duration: Math.round(summary.duration / 60),
      };
    } catch (error) {
      console.error('Erro ao calcular rota:', error.message);
      throw error;
    }
  }

  async calculateMultipleRoutes(driverCoords, clientCoords, destinationCoords) {
    try {
      const driverToClient = await this.calculateRoute(driverCoords, clientCoords);
      const clientToDestination = await this.calculateRoute(clientCoords, destinationCoords);

      return {
        driverToClient,
        clientToDestination,
        totalDistance: (
          parseFloat(driverToClient.distance) + parseFloat(clientToDestination.distance)
        ).toFixed(2),
        totalDuration: driverToClient.duration + clientToDestination.duration,
      };
    } catch (error) {
      console.error('Erro ao calcular múltiplas rotas:', error.message);
      throw error;
    }
  }
}

module.exports = new RoutingService();
