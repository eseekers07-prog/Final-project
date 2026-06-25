package com.vetclinic.petowner.ui.records

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vetclinic.petowner.data.model.Pet
import com.vetclinic.petowner.data.model.TimelineEntry
import com.vetclinic.petowner.data.repository.PetOwnerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class RecordsViewModel(
    private val repo: PetOwnerRepository = PetOwnerRepository()
) : ViewModel() {

    private val _pets = MutableStateFlow<List<Pet>>(emptyList())
    val pets: StateFlow<List<Pet>> = _pets

    private val _selectedPetId = MutableStateFlow<Int?>(null)
    val selectedPetId: StateFlow<Int?> = _selectedPetId

    private val _timeline = MutableStateFlow<List<TimelineEntry>>(emptyList())
    val timeline: StateFlow<List<TimelineEntry>> = _timeline

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    init {
        viewModelScope.launch {
            val list = repo.fetchPets().getOrDefault(emptyList())
            _pets.value = list
            list.firstOrNull()?.let { selectPet(it.petId) }
        }
    }

    fun selectPet(petId: Int) {
        _selectedPetId.value = petId
        loadTimeline(petId)
    }

    private fun loadTimeline(petId: Int) {
        viewModelScope.launch {
            _isLoading.value = true
            repo.fetchTimeline(petId).onSuccess { _timeline.value = it }
            _isLoading.value = false
        }
    }
}
