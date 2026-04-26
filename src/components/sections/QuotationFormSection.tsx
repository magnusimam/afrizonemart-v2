'use client';

import { Check } from 'lucide-react';
import { type FormEvent, useState } from 'react';

const benefits = [
  'Available in Kg and Tons',
  'Rule of Origin Certificate (AfCFTA)',
  'Standards & Certifications (ISO, WTO, Global Gap etc)',
  'Wholesale',
];

export function QuotationFormSection() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="bg-amber py-10 md:py-14" id="quotation">
      <div className="mx-auto grid max-w-site grid-cols-1 gap-8 px-4 md:grid-cols-2 md:gap-12">
        <div className="flex flex-col justify-center">
          <ul className="space-y-4">
            {benefits.map((b) => (
              <li
                key={b}
                className="flex items-start gap-3 font-raleway text-base font-semibold text-navy md:text-lg"
              >
                <Check size={22} strokeWidth={3.5} className="mt-0.5 shrink-0" aria-hidden />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-card bg-white/0"
          aria-label="Request for quotation"
        >
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              type="text"
              name="firstName"
              placeholder="First Name"
              className="w-full rounded-input border border-border bg-white px-3 py-2.5 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
            />
            <input
              required
              type="text"
              name="lastName"
              placeholder="Last Name"
              className="w-full rounded-input border border-border bg-white px-3 py-2.5 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
            />
          </div>
          <input
            required
            type="email"
            name="email"
            placeholder="Email"
            className="w-full rounded-input border border-border bg-white px-3 py-2.5 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
          />
          <select
            required
            name="productType"
            defaultValue=""
            className="w-full rounded-input border border-border bg-white px-3 py-2.5 font-sans text-sm text-charcoal focus:border-navy focus:outline-none"
          >
            <option value="" disabled>
              What product/s look at /you in need of?
            </option>
            <option value="raw-materials">Raw Materials & Industrial Goods</option>
            <option value="construction">Construction & Building Materials</option>
            <option value="electronics">Electrical & Electronic Appliances</option>
            <option value="automobile">Automobile & Accessories</option>
            <option value="home">Home Essentials</option>
            <option value="books">Books</option>
            <option value="other">Other</option>
          </select>
          <textarea
            required
            rows={3}
            name="details"
            placeholder="Kindly provide sufficient details about the product/s you would like to procure (e.g. Brand Name, Size, Weight, Colour etc)"
            className="w-full rounded-input border border-border bg-white px-3 py-2.5 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
          />
          <input
            required
            type="text"
            name="quantity"
            placeholder="Quantity"
            className="w-full rounded-input border border-border bg-white px-3 py-2.5 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
          />
          <input
            required
            type="text"
            name="location"
            placeholder="Location for Delivery: City, State & Country"
            className="w-full rounded-input border border-border bg-white px-3 py-2.5 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
          />
          <input
            required
            type="text"
            name="deliveryDate"
            placeholder="Desired Date for Delivery"
            onFocus={(e) => (e.currentTarget.type = 'date')}
            onBlur={(e) => {
              if (!e.currentTarget.value) e.currentTarget.type = 'text';
            }}
            className="w-full rounded-input border border-border bg-white px-3 py-2.5 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none"
          />

          <label className="mt-1 flex items-center gap-2 rounded-input border border-border bg-white px-3 py-3 font-sans text-sm text-charcoal">
            <input type="checkbox" required className="h-4 w-4" />
            I&apos;m not a robot
            <span className="ml-auto select-none font-raleway text-[10px] uppercase tracking-btn text-muted">
              reCAPTCHA
            </span>
          </label>

          <button
            type="submit"
            className="mt-2 self-start rounded-btn border-2 border-navy bg-white px-6 py-2.5 font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white md:text-sm"
          >
            {submitted ? 'Quotation Submitted ✓' : 'Request For Quotation'}
          </button>
        </form>
      </div>
    </section>
  );
}
