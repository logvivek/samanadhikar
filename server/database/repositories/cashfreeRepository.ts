import { CashfreeOrderRecord } from "../../types";
import { initDatabase, persistDatabase } from "../connection";

export async function saveCashfreeOrder(order: CashfreeOrderRecord): Promise<void> {
  const db = initDatabase();
  const existingIdx = db.cashfreeOrders.findIndex((o) => o.orderId === order.orderId);
  if (existingIdx >= 0) {
    db.cashfreeOrders[existingIdx] = order;
  } else {
    db.cashfreeOrders.unshift(order);
  }
  // Keep last 200 orders in memory/file
  if (db.cashfreeOrders.length > 200) {
    db.cashfreeOrders = db.cashfreeOrders.slice(0, 200);
  }
  persistDatabase();
}

export async function getCashfreeOrder(orderId: string): Promise<CashfreeOrderRecord | null> {
  const db = initDatabase();
  return db.cashfreeOrders.find((o) => o.orderId === orderId) || null;
}

export async function updateCashfreeOrder(
  orderId: string,
  updates: Partial<CashfreeOrderRecord>
): Promise<CashfreeOrderRecord | null> {
  const db = initDatabase();
  const order = db.cashfreeOrders.find((o) => o.orderId === orderId);
  if (!order) return null;

  Object.assign(order, updates);
  persistDatabase();
  return order;
}
