import { SavedCalculation } from '../types';
import { calculationRepository } from '../repositories';

export class CalculationService {
  private static instance: CalculationService;

  private constructor() {}

  public static getInstance(): CalculationService {
    if (!CalculationService.instance) {
      CalculationService.instance = new CalculationService();
    }
    return CalculationService.instance;
  }

  async getCalculations(userId: string): Promise<SavedCalculation[]> {
    return calculationRepository.getCalculations(userId);
  }

  async getCalculationByYear(userId: string, year: number): Promise<SavedCalculation | null> {
    return calculationRepository.getCalculationByYear(userId, year);
  }

  async saveCalculation(userId: string, calculation: SavedCalculation): Promise<SavedCalculation | null> {
    return calculationRepository.saveCalculation(userId, calculation);
  }

  async deleteCalculation(userId: string, calculationId: string): Promise<boolean> {
    return calculationRepository.deleteCalculation(userId, calculationId);
  }
}

export const calculationService = CalculationService.getInstance();