import { defineStore } from 'pinia'
import * as garageApi from '../services/garage.api'
import { getApiErrorInfo } from '../services/api-errors'
import type { GarageVehicle, VehicleMake, VehicleModel, VehicleSpec, VehicleSpecsQuery } from '../types/garage'

type GarageState = {
  makes: VehicleMake[]
  models: VehicleModel[]
  specs: VehicleSpec[]
  vehicles: GarageVehicle[]
  loading: boolean
  error: string | null
}

const defaultState: GarageState = {
  makes: [],
  models: [],
  specs: [],
  vehicles: [],
  loading: false,
  error: null,
}

export const useGarageStore = defineStore('garage', {
  state: (): GarageState => ({ ...defaultState }),
  getters: {
    primaryVehicle: (state) => state.vehicles.find((vehicle) => vehicle.isPrimary) ?? null,
  },
  actions: {
    async fetchMakes() {
      this.loading = true
      this.error = null
      try {
        this.makes = await garageApi.getVehicleMakes()
      } catch (e) {
        this.error = getApiErrorInfo(e).message
      } finally {
        this.loading = false
      }
    },
    async fetchModels(makeId: number) {
      this.loading = true
      this.error = null
      try {
        this.models = await garageApi.getVehicleModels(makeId)
      } catch (e) {
        this.error = getApiErrorInfo(e).message
      } finally {
        this.loading = false
      }
    },
    async fetchSpecs(query: VehicleSpecsQuery) {
      this.loading = true
      this.error = null
      try {
        this.specs = await garageApi.getVehicleSpecs(query)
      } catch (e) {
        this.error = getApiErrorInfo(e).message
      } finally {
        this.loading = false
      }
    },
    async fetchMyVehicles() {
      this.loading = true
      this.error = null
      try {
        this.vehicles = await garageApi.getMyGarageVehicles()
      } catch (e) {
        this.error = getApiErrorInfo(e).message
      } finally {
        this.loading = false
      }
    },
    async addMyVehicle(input: { vehicleSpecId: number; nickname?: string; isPrimary?: boolean }) {
      this.loading = true
      this.error = null
      try {
        await garageApi.addMyGarageVehicle(input)
        await this.fetchMyVehicles()
      } catch (e) {
        this.error = getApiErrorInfo(e).message
        throw e
      } finally {
        this.loading = false
      }
    },
    async makePrimary(id: number) {
      this.loading = true
      this.error = null
      try {
        await garageApi.makePrimaryGarageVehicle(id)
        await this.fetchMyVehicles()
      } catch (e) {
        this.error = getApiErrorInfo(e).message
        throw e
      } finally {
        this.loading = false
      }
    },
    async removeMyVehicle(id: number) {
      this.loading = true
      this.error = null
      try {
        await garageApi.removeGarageVehicle(id)
        await this.fetchMyVehicles()
      } catch (e) {
        this.error = getApiErrorInfo(e).message
        throw e
      } finally {
        this.loading = false
      }
    },
    reset() {
      Object.assign(this, defaultState)
    },
  },
})
