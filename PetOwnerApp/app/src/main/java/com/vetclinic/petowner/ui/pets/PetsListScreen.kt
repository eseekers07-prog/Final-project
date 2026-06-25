package com.vetclinic.petowner.ui.pets

import androidx.compose.foundation.background
import androidx.compose.foundation.clip
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.History
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.vetclinic.petowner.data.model.Pet
import com.vetclinic.petowner.ui.theme.SlateSecondary
import com.vetclinic.petowner.ui.theme.SlateText
import com.vetclinic.petowner.ui.theme.TealAccent

@Composable
fun PetsListScreen(
    viewModel: PetsViewModel = viewModel(),
    onViewHistory: (Int) -> Unit = {},
    onBookVisit: (Int) -> Unit = {},
    onAddPet: () -> Unit = {}
) {
    val pets by viewModel.pets.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    Box(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize().padding(20.dp)) {
            Text("My Pets", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(16.dp))

            if (isLoading) {
                CircularProgressIndicator(Modifier.align(Alignment.CenterHorizontally))
            } else if (pets.isEmpty()) {
                Text("No pets registered yet", color = SlateSecondary, modifier = Modifier.padding(top = 40.dp))
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(pets) { pet ->
                        PetCard(
                            pet = pet,
                            ageLabel = viewModel.ageLabel(pet),
                            onHistory = { onViewHistory(pet.petId) },
                            onBook = { onBookVisit(pet.petId) }
                        )
                    }
                    item { Spacer(Modifier.height(80.dp)) }
                }
            }
        }

        FloatingActionButton(
            onClick = onAddPet,
            containerColor = SlateText,
            contentColor = Color.White,
            modifier = Modifier.align(Alignment.BottomEnd).padding(20.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = "Add Pet")
        }
    }
}

@Composable
private fun PetCard(pet: Pet, ageLabel: String, onHistory: () -> Unit, onBook: () -> Unit) {
    Card(
        shape = RoundedCornerShape(18.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier.size(48.dp).clip(CircleShape).background(TealAccent.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(pet.petName.first().uppercase(), fontWeight = FontWeight.Bold, color = TealAccent)
                }
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(pet.petName, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text("${pet.species} · ${pet.breed ?: "Unknown breed"}", color = SlateSecondary, fontSize = 12.sp)
                    Text(ageLabel, color = SlateSecondary, fontSize = 11.sp)
                }
            }

            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(onClick = onHistory, shape = RoundedCornerShape(50)) {
                    Icon(Icons.Default.History, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("History", fontSize = 12.sp)
                }
                Button(
                    onClick = onBook,
                    shape = RoundedCornerShape(50),
                    colors = ButtonDefaults.buttonColors(containerColor = SlateText)
                ) {
                    Icon(Icons.Default.CalendarToday, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Book Visit", fontSize = 12.sp)
                }
            }
        }
    }
}
