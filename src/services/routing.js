import Openrouteservice from 'openrouteservice-js';

class RoutingService {
  constructor() {
    this.directions = null;
    this.baseHost = 'api.openrouteservice.org';
  }

  getDirectionsClient() {
    if (!this.directions) {
      if (!process.env.OPENROUTESERVICE_API_KEY) {
        throw new Error('OPENROUTESERVICE_API_KEY não configurada');
      }

      this.directions = new Openrouteservice.Directions({
        api_key: process.env.OPENROUTESERVICE_API_KEY,
        host: this.baseHost,
      });
    }

    return this.directions;
  }

  async calculateRoute(originCoords, destinationCoords, options = {}) {
    try {
      const client = this.getDirectionsClient();
      
      const profile = options.profile || 'driving-car';
      
      const requestParams = {
        coordinates: [
          [originCoords.longitude, originCoords.latitude],
          [destinationCoords.longitude, destinationCoords.latitude],
        ],
        profile: profile,
        format: 'json',
      };

      if (options.avoidPolygons && options.avoidPolygons.length > 0) {
        requestParams.options = {
          avoid_polygons: {
            type: 'Polygon',
            coordinates: options.avoidPolygons,
          },
        };
      }

      const result = await client.calculate(requestParams);

      const route = result.routes[0];
      const summary = route.summary;

      return {
        distance: (summary.distance / 1000).toFixed(2),
        duration: Math.round(summary.duration / 60),
        geometry: route.geometry,
      };
    } catch (error) {
      console.error('Erro ao calcular rota:', error.message);
      
      if (error.status) {
        if (error.status === 401) {
          console.error('API key inválida ou ausente');
        } else if (error.status === 403) {
          console.error('Limite de requisições da API OpenRouteService atingido');
        } else if (error.status === 400) {
          console.error('Parâmetros inválidos na requisição de rota');
        } else if (error.status === 500) {
          if (error.response) {
            error.response.json().then(details => {
              if (details.error && details.error.code === 2099) {
                console.error('Rota não encontrada entre os pontos fornecidos');
              }
            }).catch(() => {});
          }
        }
      }
      
      throw error;
    }
  }

  async calculateMultipleRoutes(driverCoords, clientCoords, destinationCoords, options = {}) {
    try {
      const driverToClient = await this.calculateRoute(driverCoords, clientCoords, options);
      const clientToDestination = await this.calculateRoute(clientCoords, destinationCoords, options);

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
export default new RoutingService();
