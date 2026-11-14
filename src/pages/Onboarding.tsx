import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AllergyToggles, PreferenceToggles, ToleranceChoices } from '../components/ProfileFields'
import { DISCLAIMER_SHORT } from '../copy'
import { useApp } from '../store/useApp'

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const setProfile = useApp((s) => s.setProfile)
  const nav = useNavigate()

  const finish = () => {
    setProfile({ onboarded: true })
    nav('/', { replace: true })
  }

  return (
    <div className="stack">
      <p className="muted" aria-live="polite">Step {step + 1} of 3</p>
      {step === 0 && (
        <>
          <h1>Welcome. How do you eat gluten-free?</h1>
          <p className="muted">
            We use this to tailor every restaurant to you, so “Great for you” means something. You can change it any time.
          </p>
          <ToleranceChoices />
        </>
      )}
      {step === 1 && (
        <>
          <h1>Anything that matters to you?</h1>
          <p className="muted">Optional. Pick what you care about and we will weigh it in your matches.</p>
          <PreferenceToggles />
        </>
      )}
      {step === 2 && (
        <>
          <h1>Any other allergies?</h1>
          <p className="muted">Optional. We will flag dishes that list these.</p>
          <AllergyToggles />
          <div className="notice">{DISCLAIMER_SHORT}</div>
        </>
      )}
      <div className="sticky-actions row spread">
        {step > 0 ? (
          <button className="btn secondary" onClick={() => setStep(step - 1)}>Back</button>
        ) : (
          <span />
        )}
        {step < 2 ? (
          <button className="btn" onClick={() => setStep(step + 1)}>Next</button>
        ) : (
          <button className="btn" onClick={finish}>Start exploring</button>
        )}
      </div>
    </div>
  )
}
