import { AccountPanel } from '../components/AccountPanel'
import { AllergyToggles, PreferenceToggles, ToleranceChoices } from '../components/ProfileFields'
import { DISCLAIMER_LONG, SAMPLE_DATA_NOTICE } from '../copy'
import { useApp } from '../store/useApp'

export default function Profile() {
  const resetAll = useApp((s) => s.resetAll)
  return (
    <div className="stack">
      <h1>Your profile</h1>
      <p className="muted">Changes apply to your matches right away.</p>
      <h2>Account</h2>
      <AccountPanel />
      <h2>Tolerance</h2>
      <ToleranceChoices />
      <h2>What matters to you</h2>
      <PreferenceToggles />
      <h2>Other allergies</h2>
      <AllergyToggles />
      <h2>About this app</h2>
      <div className="notice">{SAMPLE_DATA_NOTICE}</div>
      <p className="muted small">{DISCLAIMER_LONG}</p>
      <p className="muted small">Without an account, your data lives only in this browser and clearing site data erases it.</p>
      <button
        className="btn danger block"
        onClick={() => {
          if (window.confirm('Erase your profile, saved places, visits and edits from this browser? If you are signed in, this also clears them from your account.')) resetAll()
        }}
      >
        Erase my data
      </button>
    </div>
  )
}
