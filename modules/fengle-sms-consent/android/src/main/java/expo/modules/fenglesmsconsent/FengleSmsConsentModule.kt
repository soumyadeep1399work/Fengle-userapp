package expo.modules.fenglesmsconsent

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import androidx.core.content.ContextCompat
import androidx.core.os.BundleCompat
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.common.api.CommonStatusCodes
import com.google.android.gms.common.api.Status
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val REQUEST_CODE = 7391

/**
 * Google's SMS User Consent API: the system asks the user once whether this app
 * may read the next SMS containing a one-time code, then hands us that message.
 * No SMS permission is needed (Play policy forbids it for login apps).
 */
class FengleSmsConsentModule : Module() {
  private var pending: Promise? = null
  private var receiver: BroadcastReceiver? = null

  override fun definition() = ModuleDefinition {
    Name("FengleSmsConsent")

    // Resolves with the full text of the SMS the user allowed us to read, or null
    // (timeout after 5 minutes, user denied, or Play services unavailable).
    AsyncFunction("listen") { promise: Promise ->
      val activity = appContext.currentActivity
      val context = appContext.reactContext
      if (activity == null || context == null) {
        promise.resolve(null)
        return@AsyncFunction
      }

      finish(null)
      pending = promise

      val newReceiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context, intent: Intent) {
          if (SmsRetriever.SMS_RETRIEVED_ACTION != intent.action) return
          val extras = intent.extras ?: return
          val status = BundleCompat.getParcelable(extras, SmsRetriever.EXTRA_STATUS, Status::class.java) ?: return
          when (status.statusCode) {
            CommonStatusCodes.SUCCESS -> {
              val consentIntent = BundleCompat.getParcelable(extras, SmsRetriever.EXTRA_CONSENT_INTENT, Intent::class.java)
              val current = appContext.currentActivity
              if (consentIntent != null && current != null) {
                try {
                  current.startActivityForResult(consentIntent, REQUEST_CODE)
                } catch (e: Exception) {
                  finish(null)
                }
              } else {
                finish(null)
              }
            }
            CommonStatusCodes.TIMEOUT -> finish(null)
          }
        }
      }
      receiver = newReceiver
      ContextCompat.registerReceiver(
        context,
        newReceiver,
        IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION),
        SmsRetriever.SEND_PERMISSION,
        null,
        ContextCompat.RECEIVER_EXPORTED
      )

      SmsRetriever.getClient(activity)
        .startSmsUserConsent(null)
        .addOnFailureListener { finish(null) }
    }

    AsyncFunction("stop") {
      finish(null)
    }

    OnActivityResult { _, (requestCode, resultCode, data) ->
      if (requestCode != REQUEST_CODE) return@OnActivityResult
      val message = if (resultCode == Activity.RESULT_OK) data?.getStringExtra(SmsRetriever.EXTRA_SMS_MESSAGE) else null
      finish(message)
    }

    OnDestroy {
      finish(null)
    }
  }

  private fun finish(message: String?) {
    receiver?.let {
      try {
        appContext.reactContext?.unregisterReceiver(it)
      } catch (_: Exception) {
      }
    }
    receiver = null
    pending?.resolve(message)
    pending = null
  }
}
