package com.vetclinic.petowner

import android.Manifest
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.*
import com.vetclinic.petowner.data.remote.RetrofitClient
import com.vetclinic.petowner.ui.auth.LoginScreen
import com.vetclinic.petowner.ui.auth.SessionViewModel
import com.vetclinic.petowner.ui.navigation.PetOwnerNavHost
import com.vetclinic.petowner.ui.theme.PetOwnerTheme

class MainActivity : ComponentActivity() {

    private val notificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { /* no-op */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Android 13 (API 33) requires runtime permission for notifications —
        // used for appointment reminders / vaccination due alerts.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }

        setContent {
            PetOwnerTheme {
                val sessionViewModel: SessionViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
                var loggedIn by remember { mutableStateOf(RetrofitClient.hasSession()) }

                if (loggedIn) {
                    PetOwnerNavHost(
                        sessionViewModel = sessionViewModel,
                        onLoggedOut = { loggedIn = false }
                    )
                } else {
                    LoginScreen(
                        viewModel = sessionViewModel,
                        onLoggedIn = { loggedIn = true }
                    )
                }
            }
        }
    }
}
