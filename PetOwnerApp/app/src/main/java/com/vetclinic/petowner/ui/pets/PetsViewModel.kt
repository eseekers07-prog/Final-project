package com.vetclinic.petowner.ui.pets

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vetclinic.petowner.data.model.Pet
import com.vetclinic.petowner.data.repository.PetOwnerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.Period

class PetsViewModel(
    private val repo: PetOwnerRepository = PetOwnerRepository()
) : ViewModel() {

    private val _pets = MutableStateFlow<List<Pet>>(emptyList())
    val pets: StateFlow<List<Pet>> = _pets

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    init { loadPets() }

    fun loadPets() {
        viewModelScope.launch {
            _isLoading.value = true
            repo.fetchPets().onSuccess { _pets.value = it }
            _isLoading.value = false
        }
    }

    // Same age computation the web dashboard did client-side from date_of_birth
    fun ageLabel(pet: Pet): String {
        val dob = pet.dateOfBirth ?: return "Age unknown"
        return runCatching {
            val birth = LocalDate.parse(dob)
            val years = Period.between(birth, LocalDate.now()).years
            if (years < 1) "Puppy/Kitten" else "$years yr${if (years > 1) "s" else ""} old"
        }.getOrDefault("Age unknown")
    }
}
