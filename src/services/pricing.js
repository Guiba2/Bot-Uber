import { PRICING } from '../config/constants.js';
//const { PRICING } = require('../config/constants');

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
}
export default new PricingService;
//module.exports = new PricingService();
