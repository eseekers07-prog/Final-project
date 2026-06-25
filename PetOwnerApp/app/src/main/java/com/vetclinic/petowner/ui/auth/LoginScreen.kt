package com.vetclinic.petowner.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.vetclinic.petowner.ui.theme.SlateSecondary
import com.vetclinic.petowner.ui.theme.SlateText
import com.vetclinic.petowner.ui.theme.TealAccent

@Composable
fun LoginScreen(
    viewModel: SessionViewModel,
    onLoggedIn: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    LaunchedEffect(state.isLoggedIn) {
        if (state.isLoggedIn) onLoggedIn()
    }

    Box(
        Modifier.fillMaxSize().background(com.vetclinic.petowner.ui.theme.SlateBackground),
        contentAlignment = Alignment.Center
    ) {
        Column(
            Modifier
                .fillMaxWidth()
                .padding(28.dp),
        ) {
            Text(
                "Pet Care",
                style = MaterialTheme.typography.headlineMedium,
                color = TealAccent
            )
            Text(
                "Sign in to your owner account",
                color = SlateSecondary,
                modifier = Modifier.padding(top = 4.dp, bottom = 28.dp)
            )

            OutlinedTextField(
                value = username,
                onValueChange = { username = it },
                label = { Text("Username") },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(14.dp))
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            )

            state.error?.let {
                Spacer(Modifier.height(10.dp))
                Text(it, color = MaterialTheme.colorScheme.error, fontSize = androidx.compose.ui.unit.TextUnit.Unspecified)
            }

            Spacer(Modifier.height(24.dp))
            Button(
                onClick = { viewModel.login(username.trim(), password) },
                enabled = !state.isLoading && username.isNotBlank() && password.isNotBlank(),
                shape = RoundedCornerShape(50),
                colors = ButtonDefaults.buttonColors(containerColor = SlateText),
                modifier = Modifier.fillMaxWidth().height(50.dp)
            ) {
                if (state.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.height(20.dp).width(20.dp),
                        color = androidx.compose.ui.graphics.Color.White,
                        strokeWidth = 2.dp
                    )
                } else {
                    Text("Sign In", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
