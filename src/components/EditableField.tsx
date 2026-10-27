// src/components/EditableField.tsx
type Props = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  rows?: number;
};

export default function EditableField({
  label,
  value,
  onChange,
  disabled = false,
  rows = 3,
}: Props) {
  return (
    <div className="editable-field">
      <div className="editable-field__label">{label}</div>
      <textarea
        className="editable-field__textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={rows}
      />
    </div>
  );
}
