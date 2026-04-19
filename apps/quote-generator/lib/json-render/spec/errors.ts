export interface SpecBindingDetail {
  path: string;
  message: string;
}

export class SpecBindingError extends Error {
  readonly details: SpecBindingDetail[];
  constructor(details: SpecBindingDetail[]) {
    super(`Spec binding error: ${details.map(d => d.path).join(', ')}`);
    this.details = details;
  }
}
