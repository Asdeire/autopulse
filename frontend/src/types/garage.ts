export type VehicleMake = {
  id: number
  name: string
}

export type VehicleModel = {
  id: number
  name: string
  makeId: number
}

export type VehicleEngine = {
  id: number
  name: string
  code: string
}

export type VehicleSpec = {
  id: number
  yearFrom: number
  yearTo: number
  normalizedName: string
  make: VehicleMake
  model: VehicleModel
  engine: VehicleEngine
}

export type GarageVehicle = {
  id: number
  nickname: string | null
  isPrimary: boolean
  createdAt: string
  vehicleSpec: VehicleSpec
}

export type VehicleSpecsQuery = {
  makeId?: number
  modelId?: number
  year?: number
}
