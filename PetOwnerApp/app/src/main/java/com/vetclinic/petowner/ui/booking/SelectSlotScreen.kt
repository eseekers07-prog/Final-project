package com.vetclinic.petowner.ui.booking

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vetclinic.petowner.ui.theme.SlateSecondary
import com.vetclinic.petowner.ui.theme.SlateText
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@Composable
fun SelectSlotScreen(viewModel: BookingViewModel) {
    // Placeholder slots until a real availability endpoint exists on the backend.
    val days = remember { (0..6).map { LocalDate.now().plusDays(it.toLong()) } }
    val slots = listOf("09:00", "10:00", "11:00", "14:00", "15:00", "16:00")

    var selectedDay by remember { mutableStateOf(days.first()) }
    var selectedSlot by remember { mutableStateOf<String?>(null) }

    Column(Modifier.fillMaxSize().padding(20.dp)) {
        StepIndicator(currentStep = 2)

        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = { viewModel.goBack() }) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back")
            }
            Text("Pick Date & Time", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        }
        Spacer(Modifier.height(8.dp))
        Text("With ${viewModel.draft.vetName ?: "selected vet"}", color = SlateSecondary, fontSize = 13.sp)
        Spacer(Modifier.height(16.dp))

        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(days) { day ->
                FilterChip(
                    selected = day == selectedDay,
                    onClick = { selectedDay = day },
                    label = { Text(day.format(DateTimeFormatter.ofPattern("EEE d"))) }
                )
            }
        }

        Spacer(Modifier.height(20.dp))
        Text("Available slots", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
        Spacer(Modifier.height(10.dp))

        slots.chunked(3).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEach { slot ->
                    FilterChip(
                        selected = slot == selectedSlot,
                        onClick = { selectedSlot = slot },
                        label = { Text(slot) }
                    )
                }
            }
            Spacer(Modifier.height(8.dp))
        }

        Spacer(Modifier.weight(1f))
        Button(
            enabled = selectedSlot != null,
            onClick = { viewModel.selectSlot(selectedDay.toString(), selectedSlot!!) },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(50),
            colors = ButtonDefaults.buttonColors(containerColor = SlateText)
        ) { Text("Continue") }
    }
}
