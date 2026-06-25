package com.vetclinic.petowner.ui.records

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.clip
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.vetclinic.petowner.data.model.TimelineEntry
import com.vetclinic.petowner.data.model.TimelineKind
import com.vetclinic.petowner.ui.theme.AmberAccent
import com.vetclinic.petowner.ui.theme.IndigoAccent
import com.vetclinic.petowner.ui.theme.SlateSecondary
import com.vetclinic.petowner.ui.theme.SlateText
import com.vetclinic.petowner.ui.theme.TealAccent

@Composable
fun MedicalTimelineScreen(viewModel: RecordsViewModel = viewModel()) {
    val pets by viewModel.pets.collectAsState()
    val selectedPetId by viewModel.selectedPetId.collectAsState()
    val entries by viewModel.timeline.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    Column(Modifier.fillMaxSize().padding(20.dp)) {
        Text("Medical Timeline", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(12.dp))

        if (pets.isNotEmpty()) {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(pets) { pet ->
                    FilterChip(
                        selected = pet.petId == selectedPetId,
                        onClick = { viewModel.selectPet(pet.petId) },
                        label = { Text(pet.petName) }
                    )
                }
            }
            Spacer(Modifier.height(16.dp))
        }

        if (isLoading) {
            CircularProgressIndicator()
        } else if (entries.isEmpty()) {
            Text("No medical history yet", color = SlateSecondary)
        } else {
            LazyColumn {
                itemsIndexed(entries) { index, entry ->
                    TimelineNode(entry = entry, isLast = index == entries.lastIndex)
                }
            }
        }
    }
}

@Composable
private fun TimelineNode(entry: TimelineEntry, isLast: Boolean) {
    Row(Modifier.fillMaxWidth()) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(28.dp)) {
            Box(
                Modifier.size(12.dp).clip(CircleShape).background(dotColor(entry.kind))
            )
            if (!isLast) {
                Box(
                    Modifier
                        .width(2.dp)
                        .weight(1f)
                        .background(SlateSecondary.copy(alpha = 0.2f))
                )
            }
        }

        Spacer(Modifier.width(12.dp))

        var expanded by remember { mutableStateOf(false) }
        Card(
            shape = RoundedCornerShape(14.dp),
            elevation = CardDefaults.cardElevation(2.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp)
                .clickable { expanded = !expanded }
        ) {
            Column(Modifier.padding(14.dp)) {
                Text(entry.date, color = SlateSecondary, fontSize = 11.sp)
                Text(entry.title, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                if (expanded) {
                    entry.subtitle?.let {
                        Spacer(Modifier.height(6.dp))
                        Text(it, fontSize = 13.sp, color = SlateText.copy(alpha = 0.8f))
                    }
                    entry.vetName?.let {
                        Spacer(Modifier.height(4.dp))
                        Text("Vet: $it", fontSize = 12.sp, color = SlateSecondary)
                    }
                }
            }
        }
    }
}

private fun dotColor(kind: TimelineKind): Color = when (kind) {
    TimelineKind.Appointment -> IndigoAccent
    TimelineKind.HealthRecord -> TealAccent
    TimelineKind.Vaccination -> AmberAccent
}
