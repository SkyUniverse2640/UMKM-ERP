// ponytail: pure in-memory calculation; database-generated columns enforce this at persistence layer.
export interface PeriodicInventoryInput {
  startingStock: number;
  restockQuantity: number;
  leftoverQuantity: number;
  wasteQuantity: number;
  unitPrice: number;
}

export interface PeriodicInventoryResult {
  soldQuantity: number;
  totalRevenue: number;
}

export function calculatePeriodicDailySales(input: PeriodicInventoryInput): PeriodicInventoryResult {
  const { startingStock, restockQuantity, leftoverQuantity, wasteQuantity, unitPrice } = input;

  if (startingStock < 0 || restockQuantity < 0 || leftoverQuantity < 0 || wasteQuantity < 0 || unitPrice < 0) {
    throw new Error("Inventory counts and prices must be non-negative");
  }

  const totalAvailable = startingStock + restockQuantity;
  const unaccountedRemaining = leftoverQuantity + wasteQuantity;

  if (unaccountedRemaining > totalAvailable) {
    throw new Error(
      `Invalid inventory balance: leftover (${leftoverQuantity}) + waste (${wasteQuantity}) exceeds total available (${totalAvailable})`
    );
  }

  // Periodic Inventory formula with waste deduction
  const soldQuantity = totalAvailable - leftoverQuantity - wasteQuantity;
  const totalRevenue = soldQuantity * unitPrice;

  return {
    soldQuantity,
    totalRevenue,
  };
}
