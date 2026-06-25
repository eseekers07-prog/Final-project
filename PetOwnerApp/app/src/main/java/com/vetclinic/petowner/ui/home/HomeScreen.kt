package com.vetclinic.petowner.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clip
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.vetclinic.petowner.data.model.Appointment
import com.vetclinic.petowner.data.model.Pet
import com.vetclinic.petowner.ui.theme.SlateSecondary
import com.vetclinic.petowner.ui.theme.SlateText
import com.vetclinic.petowner.ui.theme.TealAccent
import java.time.LocalTime

@Composable
fun HomeScreen(ownerName: String, viewModel: HomeViewModel = viewModel()) {
    val state by viewModel.uiState.collectAsState()
    val greeting = remember {
        when (LocalTime.now().hour) {
            in 0..11 -> "Good morning"
            in 12..17 -> "Good afternoon"
            else -> "Good evening"
        }
    }

    Column(Modifier.fillMaxSize().padding(20.dp)) {
        Text(greeting, style = MaterialTheme.typography.labelMedium, color = SlateSecondary)
        Text(
            ownerName,
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )
        Spacer(Modifier.height(20.dp))

        if (state.isLoading) {
            CircularProgressIndicator()
        } else {
            state.nextAppointment?.let { NextAppointmentCard(it) }
                ?: EmptyAppointmentCard()

            Spacer(Modifier.height(24.dp))
            Text("Your Pets", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            Spacer(Modifier.height(12.dp))

            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                items(state.pets) { pet -> PetAvatarCard(pet) }
            }
        }

        state.error?.let {
            Spacer(Modifier.height(12.dp))
            Text(it, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
        }
    }
}

@Composable
fun NextAppointmentCard(appointment: Appointment) {
    Card(
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(Modifier.padding(20.dp)) {
            Text("Upcoming Appointment", color = SlateSecondary, fontSize = 12.sp)
            Spacer(Modifier.height(6.dp))
            Text(appointment.type, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Text(appointment.scheduledDate, color = TealAccent, fontSize = 14.sp)
        }
    }
}

@Composable
fun EmptyAppointmentCard() {
    Card(
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(Modifier.padding(20.dp)) {
            Text("No upcoming appointments", fontWeight = FontWeight.SemiBold)
            Text("Book a visit from the Book tab", color = SlateSecondary, fontSize = 12.sp)
        }
    }
}

@Composable
fun PetAvatarCard(pet: Pet) {
    Card(
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
        modifier = Modifier.width(110.dp)
    ) {
        Column(
            Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                Modifier
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(TealAccent.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Text(pet.petName.first().uppercase(), fontWeight = FontWeight.Bold, color = TealAccent)
            }
            Spacer(Modifier.height(8.dp))
            Text(pet.petName, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
            Text(pet.species, color = SlateSecondary, fontSize = 11.sp)
        }
    }
}
