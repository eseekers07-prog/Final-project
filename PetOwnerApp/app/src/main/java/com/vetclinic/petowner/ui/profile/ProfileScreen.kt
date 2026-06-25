package com.vetclinic.petowner.ui.profile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.vetclinic.petowner.ui.auth.SessionViewModel
import com.vetclinic.petowner.ui.theme.SlateSecondary
import com.vetclinic.petowner.ui.theme.SlateText

@Composable
fun ProfileScreen(sessionViewModel: SessionViewModel, onLoggedOut: () -> Unit) {
    val state by sessionViewModel.state.collectAsStateSafe()

    Column(Modifier.fillMaxSize().padding(20.dp)) {
        Text("Profile", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(20.dp))

        Card(shape = RoundedCornerShape(18.dp), elevation = CardDefaults.cardElevation(3.dp)) {
            Column(Modifier.padding(16.dp)) {
                Text("Email", color = SlateSecondary, fontSize = androidx.compose.ui.unit.TextUnit.Unspecified)
                Text(state.ownerEmail ?: "—", fontWeight = FontWeight.SemiBold)
            }
        }

        Spacer(Modifier.weight(1f))
        Button(
            onClick = {
                sessionViewModel.logout()
                onLoggedOut()
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(50),
            colors = ButtonDefaults.buttonColors(containerColor = SlateText, contentColor = Color.White)
        ) { Text("Log Out") }
    }
}

// Small helper kept local to avoid importing collectAsState twice with conflicting names
@Composable
private fun <T> kotlinx.coroutines.flow.StateFlow<T>.collectAsStateSafe() =
    androidx.compose.runtime.collectAsState(initial = this.value)
