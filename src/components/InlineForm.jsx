import React, { useEffect, useMemo, useState } from 'react';

function InlineForm({ fields, onSubmit, submitLabel = 'บันทึกข้อมูล', seed }) {
  const stableSeed = seed ?? null;
  const initialValues = useMemo(() => {
    const base = {};
    fields.forEach((field) => {
      const seedValue =
        stableSeed && Object.prototype.hasOwnProperty.call(stableSeed, field.name) ? stableSeed[field.name] : undefined;
      base[field.name] = seedValue ?? field.defaultValue ?? '';
    });
    return base;
  }, [fields, stableSeed]);

  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!onSubmit) return;
    const shouldReset = onSubmit(values);
    if (shouldReset !== false) {
      setValues(initialValues);
    }
  };

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <div className="inline-form__grid">
        {fields.map((field) => {
          const commonProps = {
            id: field.name,
            name: field.name,
            value: values[field.name] ?? '',
            onChange: handleChange,
            required: field.required,
            placeholder: field.placeholder,
          };

          if (field.type === 'select') {
            return (
              <label key={field.name}>
                <span>{field.label}</span>
                <select {...commonProps}>
                  <option value="">เลือก...</option>
                  {field.options?.map((option) => (
                    <option key={option.value ?? option} value={option.value ?? option}>
                      {option.label ?? option}
                    </option>
                  ))}
                </select>
              </label>
            );
          }

          if (field.type === 'textarea') {
            return (
              <label key={field.name}>
                <span>{field.label}</span>
                <textarea {...commonProps} rows={field.rows ?? 3} />
              </label>
            );
          }

          return (
            <label key={field.name}>
              <span>{field.label}</span>
              <input {...commonProps} type={field.type ?? 'text'} min={field.min} max={field.max} step={field.step} />
            </label>
          );
        })}
      </div>
      <div className="inline-form__actions">
        <button className="primary small" type="submit">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default InlineForm;
