"use client";

import { useState } from "react";
import { ArrowRight, Check } from "./icons";

/**
 * Not wired to a backend yet. Point `onSubmit` at your CRM/marketing endpoint
 * (HubSpot, Salesforce Web-to-Lead, a route handler, …) before launch — see the
 * README. Until then it validates in the browser and confirms locally.
 */
export function DemoForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="au-card" style={{ padding: "2.5rem", textAlign: "center", alignItems: "center" }}>
        <span className="au-icon au-icon--teal" style={{ margin: "0 auto 1.25rem" }}>
          <Check size={22} />
        </span>
        <h2 className="au-h3">Thanks — we&rsquo;ll be in touch.</h2>
        <p className="au-body">
          A member of the Audentra team will follow up within one business day to schedule a
          conversation around your institution&rsquo;s workflows.
        </p>
      </div>
    );
  }

  return (
    <form
      className="au-card"
      style={{ padding: "2rem" }}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <div className="au-form">
        <div className="au-field">
          <label htmlFor="first-name">First name</label>
          <input id="first-name" name="firstName" autoComplete="given-name" required />
        </div>
        <div className="au-field">
          <label htmlFor="last-name">Last name</label>
          <input id="last-name" name="lastName" autoComplete="family-name" required />
        </div>
        <div className="au-field au-field--full">
          <label htmlFor="email">Work email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="au-field">
          <label htmlFor="institution">Institution</label>
          <input id="institution" name="institution" autoComplete="organization" required />
        </div>
        <div className="au-field">
          <label htmlFor="title">Job title</label>
          <input id="title" name="title" autoComplete="organization-title" />
        </div>
        <div className="au-field au-field--full">
          <label htmlFor="interest">Primary area of interest</label>
          <select id="interest" name="interest" defaultValue="enrollment-readiness">
            <option value="enrollment-readiness">Enrollment readiness</option>
            <option value="enrollment-management">Enrollment management</option>
            <option value="admissions">Admissions</option>
            <option value="financial-aid">Financial aid</option>
            <option value="enrollment-operations">Enrollment operations</option>
            <option value="leadership">Institutional leadership</option>
            <option value="student-experience">Student experience</option>
          </select>
        </div>
        <div className="au-field au-field--full">
          <label htmlFor="goal">What would you like to improve?</label>
          <textarea
            id="goal"
            name="goal"
            placeholder="Tell us about the workflow, cohort, or outcome you're focused on."
          />
        </div>
        <label className="au-check" htmlFor="pilot">
          <input id="pilot" name="pilot" type="checkbox" />
          <span>I&rsquo;m interested in discussing an Audentra pilot.</span>
        </label>
      </div>

      <div className="au-btn-row">
        <button type="submit" className="au-btn au-btn--primary">
          Request a Demo
          <ArrowRight />
        </button>
      </div>
    </form>
  );
}
