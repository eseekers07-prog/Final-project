package com.vetclinic.petowner.ui.booking

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vetclinic.petowner.data.model.Pet
import com.vetclinic.petowner.data.model.Veterinarian
import com.vetclinic.petowner.data.repository.PetOwnerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class BookingDraft(
    val vetId: Int? = null,
    val vetName: String? = null,
    val petId: Int? = null,
    val date: String? = null,      // yyyy-MM-dd
    val timeSlot: String? = null,  // HH:mm
    val reason: String? = null
)

class BookingViewModel(
    private val repo: PetOwnerRepository = PetOwnerRepository()
) : ViewModel() {

    var currentStep by mutableStateOf(1)
        private set

    var draft by mutableStateOf(BookingDraft())
        private set

    val vets = MutableStateFlow<List<Veterinarian>>(emptyList())
    val pets = MutableStateFlow<List<Pet>>(emptyList())
    val isLoadingVets = MutableStateFlow(false)

    var isSubmitting by mutableStateOf(false)
        private set
    var submitError by mutableStateOf<String?>(null)
        private set
    var submitSuccess by mutableStateOf(false)
        private set

    init {
        viewModelScope.launch { pets.value = repo.fetchPets().getOrDefault(emptyList()) }
        loadVets()
    }

    fun loadVets() {
        viewModelScope.launch {
            isLoadingVets.value = true
            vets.value = repo.fetchVets().getOrDefault(emptyList())
            isLoadingVets.value = false
        }
    }

    fun selectVet(vet: Veterinarian) {
        draft = draft.copy(vetId = vet.vetId, vetName = vet.fullName)
        currentStep = 2
    }

    fun selectSlot(date: String, time: String) {
        draft = draft.copy(date = date, timeSlot = time)
        currentStep = 3
    }

    fun selectPet(petId: Int) { draft = draft.copy(petId = petId) }
    fun updateReason(text: String) { draft = draft.copy(reason = text) }

    fun goBack() { if (currentStep > 1) currentStep-- }

    fun submit() {
        val d = draft
        if (d.vetId == null || d.petId == null || d.date == null || d.timeSlot == null) {
            submitError = "Please complete all steps"
            return
        }
        viewModelScope.launch {
            isSubmitting = true
            submitError = null
            repo.bookAppointment(
                vetId = d.vetId,
                petId = d.petId,
                scheduledDate = "${d.date} ${d.timeSlot}:00",
                reason = d.reason
            ).onSuccess {
                submitSuccess = true
            }.onFailure {
                submitError = it.message ?: "Booking failed"
            }
            isSubmitting = false
        }
    }

    fun reset() {
        currentStep = 1
        draft = BookingDraft()
        submitSuccess = false
        submitError = null
    }
}
