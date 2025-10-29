import os
import httpx
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)


class LocationData(BaseModel):
    """Location data model."""
    latitude: float
    longitude: float
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None


class HealthFacility(BaseModel):
    """Health facility model."""
    id: str
    name: str
    location: LocationData
    facility_type: str  # hospital, clinic, pharmacy, etc.
    services: List[str]
    contact_info: Dict[str, str]
    distance_km: Optional[float] = None
    rating: Optional[float] = None


class RouteInfo(BaseModel):
    """Route information model."""
    distance_km: float
    duration_minutes: int
    steps: List[str]
    transportation_mode: str


class MappingService:
    """Integration with mapping and location services."""
    
    def __init__(self):
        self.google_maps_api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        self.mapbox_api_key = os.getenv("MAPBOX_API_KEY")
        self.base_url_google = "https://maps.googleapis.com/maps/api"
        self.base_url_mapbox = "https://api.mapbox.com"
        
    async def geocode_address(self, address: str) -> LocationData:
        """Convert address to coordinates."""
        try:
            if self.google_maps_api_key:
                return await self._geocode_google(address)
            elif self.mapbox_api_key:
                return await self._geocode_mapbox(address)
            else:
                # Fallback to mock data for development
                return await self._geocode_mock(address)
        except Exception as e:
            logger.error(f"Geocoding failed: {e}")
            raise HTTPException(status_code=500, detail="Geocoding service unavailable")
    
    async def reverse_geocode(self, latitude: float, longitude: float) -> LocationData:
        """Convert coordinates to address."""
        try:
            if self.google_maps_api_key:
                return await self._reverse_geocode_google(latitude, longitude)
            elif self.mapbox_api_key:
                return await self._reverse_geocode_mapbox(latitude, longitude)
            else:
                # Fallback to mock data
                return await self._reverse_geocode_mock(latitude, longitude)
        except Exception as e:
            logger.error(f"Reverse geocoding failed: {e}")
            raise HTTPException(status_code=500, detail="Reverse geocoding service unavailable")
    
    async def find_nearby_health_facilities(
        self, 
        location: LocationData, 
        radius_km: float = 10,
        facility_type: Optional[str] = None
    ) -> List[HealthFacility]:
        """Find nearby health facilities."""
        try:
            if self.google_maps_api_key:
                return await self._find_facilities_google(location, radius_km, facility_type)
            else:
                # Fallback to mock data
                return await self._find_facilities_mock(location, radius_km, facility_type)
        except Exception as e:
            logger.error(f"Finding facilities failed: {e}")
            raise HTTPException(status_code=500, detail="Facility search service unavailable")
    
    async def get_route(
        self, 
        origin: LocationData, 
        destination: LocationData,
        mode: str = "driving"
    ) -> RouteInfo:
        """Get route information between two points."""
        try:
            if self.google_maps_api_key:
                return await self._get_route_google(origin, destination, mode)
            elif self.mapbox_api_key:
                return await self._get_route_mapbox(origin, destination, mode)
            else:
                # Fallback to mock data
                return await self._get_route_mock(origin, destination, mode)
        except Exception as e:
            logger.error(f"Route calculation failed: {e}")
            raise HTTPException(status_code=500, detail="Route service unavailable")
    
    async def calculate_distance(
        self, 
        point1: LocationData, 
        point2: LocationData
    ) -> float:
        """Calculate distance between two points in kilometers."""
        from math import radians, sin, cos, sqrt, atan2
        
        # Haversine formula
        R = 6371  # Earth's radius in kilometers
        
        lat1, lon1 = radians(point1.latitude), radians(point1.longitude)
        lat2, lon2 = radians(point2.latitude), radians(point2.longitude)
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        return R * c
    
    # Google Maps API implementations
    async def _geocode_google(self, address: str) -> LocationData:
        """Geocode using Google Maps API."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url_google}/geocode/json",
                params={
                    "address": address,
                    "key": self.google_maps_api_key
                }
            )
            data = response.json()
            
            if data["status"] == "OK" and data["results"]:
                result = data["results"][0]
                location = result["geometry"]["location"]
                components = result["address_components"]
                
                return LocationData(
                    latitude=location["lat"],
                    longitude=location["lng"],
                    address=result["formatted_address"],
                    city=self._extract_component(components, "locality"),
                    country=self._extract_component(components, "country"),
                    postal_code=self._extract_component(components, "postal_code")
                )
            else:
                raise HTTPException(status_code=404, detail="Address not found")
    
    async def _reverse_geocode_google(self, latitude: float, longitude: float) -> LocationData:
        """Reverse geocode using Google Maps API."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url_google}/geocode/json",
                params={
                    "latlng": f"{latitude},{longitude}",
                    "key": self.google_maps_api_key
                }
            )
            data = response.json()
            
            if data["status"] == "OK" and data["results"]:
                result = data["results"][0]
                components = result["address_components"]
                
                return LocationData(
                    latitude=latitude,
                    longitude=longitude,
                    address=result["formatted_address"],
                    city=self._extract_component(components, "locality"),
                    country=self._extract_component(components, "country"),
                    postal_code=self._extract_component(components, "postal_code")
                )
            else:
                raise HTTPException(status_code=404, detail="Location not found")
    
    async def _find_facilities_google(self, location: LocationData, radius_km: float, facility_type: Optional[str]) -> List[HealthFacility]:
        """Find facilities using Google Places API."""
        search_type = "hospital" if not facility_type else facility_type
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url_google}/place/nearbysearch/json",
                params={
                    "location": f"{location.latitude},{location.longitude}",
                    "radius": radius_km * 1000,  # Convert to meters
                    "type": search_type,
                    "key": self.google_maps_api_key
                }
            )
            data = response.json()
            
            facilities = []
            for place in data.get("results", []):
                facility_location = LocationData(
                    latitude=place["geometry"]["location"]["lat"],
                    longitude=place["geometry"]["location"]["lng"]
                )
                
                distance = await self.calculate_distance(location, facility_location)
                
                facilities.append(HealthFacility(
                    id=place["place_id"],
                    name=place["name"],
                    location=facility_location,
                    facility_type=search_type,
                    services=place.get("types", []),
                    contact_info={"address": place.get("vicinity", "")},
                    distance_km=distance,
                    rating=place.get("rating")
                ))
            
            return sorted(facilities, key=lambda x: x.distance_km or float('inf'))
    
    async def _get_route_google(self, origin: LocationData, destination: LocationData, mode: str) -> RouteInfo:
        """Get route using Google Directions API."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url_google}/directions/json",
                params={
                    "origin": f"{origin.latitude},{origin.longitude}",
                    "destination": f"{destination.latitude},{destination.longitude}",
                    "mode": mode,
                    "key": self.google_maps_api_key
                }
            )
            data = response.json()
            
            if data["status"] == "OK" and data["routes"]:
                route = data["routes"][0]
                leg = route["legs"][0]
                
                steps = [step["html_instructions"] for step in leg["steps"]]
                
                return RouteInfo(
                    distance_km=leg["distance"]["value"] / 1000,
                    duration_minutes=leg["duration"]["value"] / 60,
                    steps=steps,
                    transportation_mode=mode
                )
            else:
                raise HTTPException(status_code=404, detail="Route not found")
    
    # Mapbox API implementations (similar structure)
    async def _geocode_mapbox(self, address: str) -> LocationData:
        """Geocode using Mapbox API."""
        # Implementation for Mapbox geocoding
        pass
    
    async def _reverse_geocode_mapbox(self, latitude: float, longitude: float) -> LocationData:
        """Reverse geocode using Mapbox API."""
        # Implementation for Mapbox reverse geocoding
        pass
    
    async def _get_route_mapbox(self, origin: LocationData, destination: LocationData, mode: str) -> RouteInfo:
        """Get route using Mapbox Directions API."""
        # Implementation for Mapbox routing
        pass
    
    # Mock implementations for development
    async def _geocode_mock(self, address: str) -> LocationData:
        """Mock geocoding for development."""
        # Return mock coordinates for common African cities
        mock_locations = {
            "nairobi": LocationData(latitude=-1.2921, longitude=36.8219, address="Nairobi, Kenya", city="Nairobi", country="Kenya"),
            "lagos": LocationData(latitude=6.5244, longitude=3.3792, address="Lagos, Nigeria", city="Lagos", country="Nigeria"),
            "cape town": LocationData(latitude=-33.9249, longitude=18.4241, address="Cape Town, South Africa", city="Cape Town", country="South Africa"),
            "accra": LocationData(latitude=5.6037, longitude=-0.1870, address="Accra, Ghana", city="Accra", country="Ghana")
        }
        
        for city, location in mock_locations.items():
            if city in address.lower():
                return location
        
        # Default to Nairobi
        return mock_locations["nairobi"]
    
    async def _reverse_geocode_mock(self, latitude: float, longitude: float) -> LocationData:
        """Mock reverse geocoding."""
        return LocationData(
            latitude=latitude,
            longitude=longitude,
            address=f"Mock Address at {latitude}, {longitude}",
            city="Mock City",
            country="Mock Country"
        )
    
    async def _find_facilities_mock(self, location: LocationData, radius_km: float, facility_type: Optional[str]) -> List[HealthFacility]:
        """Mock facility search."""
        mock_facilities = [
            HealthFacility(
                id="mock_hospital_1",
                name="Central Hospital",
                location=LocationData(
                    latitude=location.latitude + 0.01,
                    longitude=location.longitude + 0.01,
                    address="123 Hospital Street"
                ),
                facility_type="hospital",
                services=["emergency", "surgery", "pediatrics"],
                contact_info={"phone": "+254-123-456789", "email": "info@centralhospital.ke"},
                distance_km=1.5,
                rating=4.2
            ),
            HealthFacility(
                id="mock_clinic_1",
                name="Community Health Clinic",
                location=LocationData(
                    latitude=location.latitude - 0.005,
                    longitude=location.longitude + 0.008,
                    address="456 Clinic Road"
                ),
                facility_type="clinic",
                services=["general_practice", "vaccination", "maternal_health"],
                contact_info={"phone": "+254-987-654321"},
                distance_km=0.8,
                rating=4.0
            ),
            HealthFacility(
                id="mock_pharmacy_1",
                name="MediCare Pharmacy",
                location=LocationData(
                    latitude=location.latitude + 0.003,
                    longitude=location.longitude - 0.002,
                    address="789 Pharmacy Avenue"
                ),
                facility_type="pharmacy",
                services=["prescription", "otc_medications", "consultation"],
                contact_info={"phone": "+254-555-123456"},
                distance_km=0.4,
                rating=4.5
            )
        ]
        
        # Filter by facility type if specified
        if facility_type:
            mock_facilities = [f for f in mock_facilities if f.facility_type == facility_type]
        
        # Filter by radius
        filtered_facilities = [f for f in mock_facilities if f.distance_km <= radius_km]
        
        return sorted(filtered_facilities, key=lambda x: x.distance_km)
    
    async def _get_route_mock(self, origin: LocationData, destination: LocationData, mode: str) -> RouteInfo:
        """Mock route calculation."""
        distance = await self.calculate_distance(origin, destination)
        
        # Estimate duration based on mode
        speed_kmh = {
            "driving": 50,
            "walking": 5,
            "bicycling": 15,
            "transit": 30
        }.get(mode, 50)
        
        duration_minutes = (distance / speed_kmh) * 60
        
        return RouteInfo(
            distance_km=distance,
            duration_minutes=int(duration_minutes),
            steps=[
                f"Head towards destination",
                f"Continue for {distance:.1f} km",
                f"Arrive at destination"
            ],
            transportation_mode=mode
        )
    
    def _extract_component(self, components: List[Dict], component_type: str) -> Optional[str]:
        """Extract address component from Google Maps response."""
        for component in components:
            if component_type in component["types"]:
                return component["long_name"]
        return None


# Global instance
mapping_service = MappingService()