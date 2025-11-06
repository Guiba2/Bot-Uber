import { PRICING } from '../config/constants.js';

class PricingService {
  calculatePrice(distanceKm) {
    const distance = parseFloat(distanceKm);
    const calculatedPrice = PRICING.BASE_FARE + (distance * PRICING.PRICE_PER_KM);
    
    return Math.max(calculatedPrice, PRICING.MINIMUM_FARE).toFixed(2);
  }

  formatPrice(price) {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
  }

  getPriceBreakdown(distanceKm) {
    const distance = parseFloat(distanceKm);
    const baseFare = PRICING.BASE_FARE;
    const distanceFare = distance * PRICING.PRICE_PER_KM;
    const total = this.calculatePrice(distanceKm);

    return {
      baseFare: baseFare.toFixed(2),
      distanceFare: distanceFare.toFixed(2),
      distance: distance.toFixed(2),
      total,
      formatted: this.formatPrice(total),
    };
  }

  // Novo método para detalhar preço com separação de trechos
  getPriceBreakdownDetailed(driverToClientKm, clientToDestinationKm) {
    const driverToClient = parseFloat(driverToClientKm);
    const clientToDestination = parseFloat(clientToDestinationKm);
    const totalDistance = driverToClient + clientToDestination;
    
    const baseFare = PRICING.BASE_FARE;
    const driverToClientFare = driverToClient * PRICING.PRICE_PER_KM;
    const clientToDestinationFare = clientToDestination * PRICING.PRICE_PER_KM;
    const distanceFare = totalDistance * PRICING.PRICE_PER_KM;
    
    const subtotal = baseFare + distanceFare;
    const total = Math.max(subtotal, PRICING.MINIMUM_FARE);

    return {
      baseFare: baseFare.toFixed(2),
      driverToClientDistance: driverToClient.toFixed(2),
      driverToClientFare: driverToClientFare.toFixed(2),
      clientToDestinationDistance: clientToDestination.toFixed(2),
      clientToDestinationFare: clientToDestinationFare.toFixed(2),
      totalDistance: totalDistance.toFixed(2),
      distanceFare: distanceFare.toFixed(2),
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2),
      formatted: this.formatPrice(total),
      formattedBaseFare: this.formatPrice(baseFare),
      formattedDriverToClientFare: this.formatPrice(driverToClientFare),
      formattedClientToDestinationFare: this.formatPrice(clientToDestinationFare),
      formattedDistanceFare: this.formatPrice(distanceFare),
    };
  }
}

export default new PricingService();