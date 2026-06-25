package com.vetclinic.petowner.ui.booking

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vetclinic.petowner.ui.theme.SlateSecondary
import com.vetclinic.petowner.ui.theme.SlateText

@Composable
fun ConfirmBookingScreen(viewModel: BookingViewModel, onDone: () -> Unit) {
    val pets by viewModel.pets.collectAsState()
    val draft = viewModel.draft
    var reasonText by remember { mutableStateOf("") }

    LaunchedEffect(viewModel.submitSuccess) {
        if (viewModel.submitSuccess) {
            onDone()
            viewModel.reset()
        }
    }

    Column(Modifier.fillMaxSize().padding(20.dp)) {
        StepIndicator(currentStep = 3)
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = { viewModel.goBack() }) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back")
            }
            Text("Confirm Appointment", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        }
        Spacer(Modifier.height(16.dp))

        Text("Which pet?", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            pets.forEach { pet ->
                FilterChip(
                    selected = draft.petId == pet.petId,
                    onClick = { viewModel.selectPet(pet.petId) },
                    label = { Text(pet.petName) }
                )
            }
        }

        Spacer(Modifier.height(20.dp))
        Card(shape = RoundedCornerShape(18.dp), elevation = CardDefaults.cardElevation(4.dp)) {
            Column(Modifier.padding(16.dp)) {
                SummaryRow("Veterinarian", draft.vetName ?: "—")
                SummaryRow("Date", draft.date ?: "—")
                SummaryRow("Time", draft.timeSlot ?: "—")
            }
        }

        Spacer(Modifier.height(16.dp))
        OutlinedTextField(
            value = reasonText,
            onValueChange = { reasonText = it; viewModel.updateReason(it) },
            label = { Text("Reason for visit (optional)") },
            modifier = Modifier.fillMaxWidth(),
            minLines = 3
        )

        viewModel.submitError?.let {
            Spacer(Modifier.height(8.dp))
            Text(it, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
        }

        Spacer(Modifier.weight(1f))
        Button(
            enabled = !viewModel.isSubmitting && draft.petId != null,
            onClick = { viewModel.submit() },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(50),
            colors = ButtonDefaults.buttonColors(containerColor = SlateText)
        ) {
            if (viewModel.isSubmitting) {
                CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White)
            } else {
                Text("Confirm Booking")
            }
        }
    }
}

@Composable
private fun SummaryRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = SlateSecondary, fontSize = 13.sp)
        Text(value, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
    }
}
