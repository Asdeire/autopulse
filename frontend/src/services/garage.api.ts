import { http } from './http'
import type { GarageVehicle, VehicleMake, VehicleModel, VehicleSpec, VehicleSpecsQuery } from '../types/garage'

export async function getVehicleMakes() {
  const res = await http.get<VehicleMake[]>('/vehicles/makes')
  return res.data
}

export async function getVehicleModels(makeId: number) {
  const res = await http.get<VehicleModel[]>('/vehicles/models', { params: { makeId } })
  return res.data
}

export async function getVehicleSpecs(query: VehicleSpecsQuery) {
  const res = await http.get<VehicleSpec[]>('/vehicles/specs', { params: query })
  return res.data
}

export async function getMyGarageVehicles() {
  const res = await http.get<GarageVehicle[]>('/garage/vehicles')
  return res.data
}

export async function addMyGarageVehicle(input: { vehicleSpecId: number; nickname?: string; isPrimary?: boolean }) {
  const res = await http.post<GarageVehicle>('/garage/vehicles', input)
  return res.data
}

export async function makePrimaryGarageVehicle(id: number) {
  const res = await http.patch<GarageVehicle>(`/garage/vehicles/${id}/primary`)
  return res.data
}

export async function removeGarageVehicle(id: number) {
  await http.delete(`/garage/vehicles/${id}`)
}
