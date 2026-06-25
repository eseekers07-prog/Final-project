package com.vetclinic.petowner.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vetclinic.petowner.data.model.Appointment
import com.vetclinic.petowner.data.model.AppointmentStatus
import com.vetclinic.petowner.data.model.Pet
import com.vetclinic.petowner.data.repository.PetOwnerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class HomeUiState(
    val isLoading: Boolean = false,
    val pets: List<Pet> = emptyList(),
    val nextAppointment: Appointment? = null,
    val error: String? = null
)

class HomeViewModel(
    private val repo: PetOwnerRepository = PetOwnerRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState

    init { loadDashboard() }

    fun loadDashboard() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)

            val petsResult = repo.fetchPets()
            val apptResult = repo.fetchAppointments()

            // Same filter+sort the web dashboard used to compute "next appointment"
            val next = apptResult.getOrNull()
                ?.filter { it.status == AppointmentStatus.scheduled }
                ?.minByOrNull { it.scheduledDate }

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                pets = petsResult.getOrDefault(emptyList()),
                nextAppointment = next,
                error = petsResult.exceptionOrNull()?.message
                    ?: apptResult.exceptionOrNull()?.message
            )
        }
    }
}
