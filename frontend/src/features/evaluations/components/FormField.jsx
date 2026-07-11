import { Label } from '../../../components/ui/label';

// Thin presentational wrapper around Formik's touched/error pair - renders the
// inline validation message below the field, per the "show validation errors
// inline below each field" requirement.
export function FormField({ label, htmlFor, error, touched, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {touched && error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
