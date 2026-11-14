import { AccountPanel } from '../components/AccountPanel'
import { AllergyToggles, PreferenceToggles, ToleranceChoices } from '../components/ProfileFields'
import { DISCLAIMER_LONG, SAMPLE_DATA_NOTICE } from '../copy'
import { removeAllMyPhotos } from '../photos/photos'
import { useApp } from '../store/useApp'
import { useAuth } from '../store/useAuth'

export default function Profile() {
  const resetAll = useApp((s) => s.resetAll)
  const signedIn = useAuth((s) => !!s.user)
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
        onClick={async () => {
          if (!window.confirm('Erase your profile, saved places, visits, edits and photos from this browser? If you are signed in, this also clears them from your account.')) return
          if (signedIn) {
            try {
              await removeAllMyPhotos()
            } catch {
              window.alert('Could not delete your photos. Check your connection and try again. Nothing was erased.')
              return
            }
          }
          resetAll()
        }}
      >
        Erase my data
      </button>
    </div>
  )
}
