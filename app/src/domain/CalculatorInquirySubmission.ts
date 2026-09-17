import type { CalculatorInquiryCustomer } from "./CalculatorInquiryLead";
import type { ProductConfiguration } from "./ProductConfiguration";

/**
 * Public payload accepted from the calculator UI.
 *
 * Pricing data is intentionally excluded. The server rebuilds the quote from
 * the submitted configuration and the published pricing snapshot.
 */
export interface CalculatorInquirySubmission {
  customer: CalculatorInquiryCustomer;
  configuration: ProductConfiguration;
}
