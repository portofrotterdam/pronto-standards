interface IEvent {
    /** UUID identifying the event */
    uuid : UUID
    /** Follows semantic versioning, see https://semver.org */
    version : "3.2.1"
    /** System creating the event, unique within participants */
    source: string
    eventType : EventType
    /** Time at which the event was created */
    recordTime : ISO8601DateTime
    /** Time at which the event occured/will occur. The meaning of this should be interperted according to eventType */
    eventTime: ISO8601DateTime
    ship : IShip
    port : UNLOCODE
    portcallId ?: LocalPortcallId
    location ?: IEventLocation
    context ?: IEventContext
}

/** A ISO 8601 compatible date time with timezone
 * Follows YYYY-MM-DDThh:mm:ssTZD as defined in https://www.w3.org/TR/NOTE-datetime
 * Example "2017-09-01T12:00:12Z"
 * WARNING: this spec allows any ISO 8601 timezone offset (e.g. +02:00), while the nautical port information standard only allows the Z timezone
 * This might get changed either in this spec or in the nautical port information standard
 * We recommend writing only events in zulu time, but reading events with any offset
 * @TJS-format date-time
 */
type ISO8601DateTime = string

/** A Universally Unique Identifier for the event
  * Generated by the event creator
  * @pattern ^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$
  */
type UUID = string

/** A UN/LOCODE designating a port
 * @pattern ^[A-Z]{2}[A-Z2-9]{3}$
 * @example "NLRTM"
 */
type UNLOCODE = string

/** A local port call identifier issued by the port authority or an organisation authorized by the port authority
 * Must be prefixed by the UNLOCODE of the issuing port, and followed by an identifier of 1 to 32 characters
 * Allowed characters in the identifier: a-z and A-Z (basic latin block letters), 0-9 (basic latin block digits), - (U+002D) and _ (U+005F)
 * @pattern ^[A-Z]{2}[A-Z2-9]{3}[a-zA-Z0-9\-_]{1,32}$
 * @example NLRTM17123456 is a portcall at port NLRTM, and was designated as call number 17123456 by the NLRTM port authority
 */
type LocalPortcallId = string

/** Bundles identifiers of a ship, but not information about the ship
 * At least an IMO, ENI, USCG or MMSI must be provided, with IMO being preferred over ENI, and ENI being preferred over MMSI
 * @minProperties 1
 */
interface IShip {
   imo ?: IMO
   eni ?: ENI
   mmsi ?: MMSI
   uscg ?: USCG
   /** Name is informative only */
   name ?: string
}

/** International Maritime Organization (IMO) ship reference number
 * @pattern ^[0-9]{7}$
 */
type IMO = string

/** European Number of Identification (ENI) ship reference number
 * @pattern ^[0-9]{8}$
 */
type ENI = string

/** Maritime Mobile Service Identity, corresponding to the AIS transponder of the ship
 * @pattern ^[0-9]{9}$
 */
type MMSI = string

/** United States Coast Guard vessel identification number
 * @pattern ^(?:[0-9]{6,8}|[a-zA-Z][0-9]{6,7}|[a-zA-Z]{2}[0-9]{6})$
 */
type USCG = string

/** Identifies a physical location at which the event will take place */
interface IEventLocation {
    type: EventLocationType
    gln ?: GLN
    glnExtension ?: GLNExtension

    /** The Geometry Object of the GeoJSON specification:
    *  https://tools.ietf.org/html/rfc7946#page-7
    *  The World Geodetic System (WGS84) is used as its reference coordinate system.
    */
    geo ?: Geometry

    /** In case GLN is present, name is informative only
     * To provide a transition period to allow the introduction of GLNs in port, events are not required to have GLN in v3.
     * In this case, name MUST be unique per source system and consumers are allowed to link the name to locations in their master data
     */
     name ?: string
}

/** Global Location Number identifying a physical location
 * @see the GLN Specification: https://www.gs1.org/gln
 * @pattern ^[0-9]{13}$
 */
type GLN = string

/** GLN Extension component, identifying a physical sublocation of a location
 * @see AI 254: https://www.gs1.org/sites/default/files/docs/barcodes/GS1_General_Specifications.pdf
 * @pattern ^[0-9]{1,20}$
 */
type GLNExtension = string

/**
* A Position is an array of (lon, lat) coordinates (The altitude element is not supported)
* https://tools.ietf.org/html/rfc7946#section-3.1.1
* Coordinates are in WGS 84: https://tools.ietf.org/html/rfc7946#ref-WGS84
*/

type GeoPosition = [number, number]

/**
* A subset of a GeoJSON Geometry object.
* https://tools.ietf.org/html/rfc7946#section-3
*/

type Geometry = IPoint | IPolygon

/**
* Point geometry object.
* https://tools.ietf.org/html/rfc7946#section-3.1.2
*
*/
interface IPoint {
    type: "Point"
    coordinates: GeoPosition
}

/**
* Polygon geometry object.
* https://tools.ietf.org/html/rfc7946#section-3.1.6
*/
interface IPolygon {
    type: "Polygon"
    coordinates: GeoPosition[][]
}


/** EventContext is a key-value object in which users are allowed to put custom keys for any purposes
 * The following keys have pre-defined meanings within the spec
 * Keys in this object are always optional
 */
interface IEventContext {
    /** Used in combination with port.xxx.portAuthority to convey whether the port authority has given clearance for the ship to enter the port */
    clearance ?: boolean
    /** Used in combination with eta vessel or distanceToPort.at.vessel events, to inform how far away the vessel currently is */
    distanceToLocationNM ?: number
    /** Maximum actual or expected static vessel draught at the event time in centimeters (integer) */
    draught ?: number
    /** Mooring information, associated with berth events */
    mooring ?: {
      /** Bollard at the fore of the ship
       * Bollards are preferably integers, but some ports use fractional bollard numbers
       */
      bollardFore: number,
      /** Bollard at the aft of the ship */
      bollardAft: number,
      /** True if the ship is doulbe banked, there is a ship in between it and the berth */
      doubleBanked ?: boolean,
      /** Mooring orientation */
      orientation ?: "port" | "starboard"
    }
    /** The ship associated with a service event, e.g. the bunkers that will provide the bunker fuel */
    serviceShip ?: IShip
    /** The number of service ships, for when the specific service ships are not known yet
      * @minimum 0
      */
    serviceShipNumber ?: number
    movementId ?: MovementId
    berthVisitId ?: BerthVisitId
    serviceId ?: ServiceId
    organisationPortcallId ?: OrganisationPortcallId
    /** The stakeholder ids of the stakeholders that should have access to the data from this event */
    stakeholders ?: string[]
}

/** Case-insensitive identifier for a movement, which is a ship traveling from one location to another inside a portcall
 * @see movement id spec
 * @pattern ^MID-[a-zA-Z0-9_]+-[a-zA-Z0-9_]+$
 */
type MovementId = string

/** Case-insensitive identifier for a berth visit, which is a ship being alongside a single berth
 * @see berth visit id spec
 * @pattern ^BID-[a-zA-Z0-9_]+-[a-zA-Z0-9_]+$
 */
type BerthVisitId = string

/** Case-insensitive identifier for a single service activity, like a bunker activity
 * @see service id spec
 * @pattern ^SID-[a-zA-Z0-9_]+-[a-zA-Z0-9_]+$
 */
type ServiceId = string

/** Case-insensitive identifier for a single service activity, like a bunker activity
 * @see organisation port call id spec
 * @pattern ^PID-[a-zA-Z0-9_]+-[a-zA-Z0-9_]+$
 */
type OrganisationPortcallId = string

/** Designates the type of events
 * The format is a string composed of 3 parts, separated by a dot: PortActivity.TimeType.EventParty
 * Not all combinations are valid, they are restricted to the following specified event types
 */
type EventType =
    "anchorArea.ata.vessel" |
    "anchorArea.atd.vessel" |
    "anchorArea.eta.portAuthority" |
    "anchorArea.ata.portAuthority" |
    "anchorArea.etd.portAuthority" |
    "anchorArea.atd.portAuthority" |
    "berth.ata.portAuthority" |
    "berth.ata.terminal" |
    "berth.ata.vessel" |
    "berth.ata.carrier" |
    "berth.atd.portAuthority" |
    "berth.atd.terminal" |
    "berth.atd.vessel" |
    "berth.ata.carrier" |
    "berth.cancel.agent" |
    "berth.cancel.portAuthority" |
    "berth.cancel.terminal" |
    "berth.eta.agent" |
    "berth.eta.pilot" |
    "berth.eta.portAuthority" |
    "berth.eta.predictor" |
    "berth.etd.agent" |
    "berth.etd.pilot" |
    "berth.etd.carrier" |
    "berth.etd.predictor" |
    "berth.etd.terminal" |
    "berth.etd.carrier" |
    "berth.pta.terminal" |
    "berth.ptd.portAuthority" |
    "berth.ptd.terminal" |
    "berth.rta.terminal" |
    "berth.rtd.portAuthority" |
    "bunkerPW.atc.vessel" |
    "bunkerPW.ats.vessel" |
    "bunkerService.atc.bunkerService" |
    "bunkerService.atc.portAuthority" |
    "bunkerService.atc.vessel" |
    "bunkerService.ats.bunkerService" |
    "bunkerService.ats.portAuthority" |
    "bunkerService.ats.vessel" |
    "bunkerService.cancel.bunkerService" |
    "bunkerService.cancel.portAuthority" |
    "bunkerService.etc.bunkerService" |
    "bunkerService.ets.bunkerService" |
    "cargoOperations.atc.terminal" |
    "cargoOperations.ats.terminal" |
    "cargoOperations.etc.terminal" |
    "cargoOperations.ets.terminal" |
    "customs.atc.vessel" |
    "customs.ats.vessel" |
    "fairway.ata.vessel" |
    "firstLineReleased.at.linesmen" |
    "firstLineReleased.at.vessel" |
    "firstLineSecured.at.linesmen" |
    "firstLineSecured.at.vessel" |
    "floatingCrane.atc.vessel" |
    "floatingCrane.ats.vessel" |
    "immigration.atc.vessel" |
    "immigration.ats.vessel" |
    "lastLineReleased.at.linesmen" |
    "lastLineReleased.at.vessel" |
    "lastLineSecured.at.linesmen" |
    "lastLineSecured.at.vessel" |
    "pilotBoardingPlace.ata.vessel" |
    "pilotBoardingPlace.ata.carrier" |
    "pilotBoardingPlace.atd.vessel" |
    "pilotBoardingPlace.atd.carrier" |
    "pilotBoardingPlace.eta.agent" |
    "pilotBoardingPlace.eta.pilot" |
    "pilotBoardingPlace.eta.predictor" |
    "pilotBoardingPlace.eta.vessel" |
    "pilotBoardingPlace.eta.carrier" |
    "pilotBoardingPlace.etd.predictor" |
    "pilotBoardingPlace.etd.carrier" |
    "pilotBoardingPlace.pta.portAuthority" |
    "pilotBoardingPlace.rta.portAuthority" |
    "pilotDisembarked.at.pilot" |
    "pilotDisembarked.at.portAuthority" |
    "pilotDisembarked.at.vessel" |
    "pilotOnBoard.at.pilot" |
    "pilotOnBoard.at.portAuthority" |
    "pilotOnBoard.at.vessel" |
    "pilotOnBoard.et.pilot" |
    "port.ata.agent" |
    "port.ata.portAuthority" |
    "port.ata.vessel" |
    "port.ata.carrier" |
    "port.atd.agent" |
    "port.atd.portAuthority" |
    "port.atd.vessel" |
    "port.atd.carrier" |
    "port.cancel.agent" |
    "port.cancel.portAuthority" |
    "port.cancel.carrier" |
    "port.eta.agent" |
    "port.eta.portAuthority" |
    "port.eta.carrier" |
    "port.etd.agent" |
    "port.etd.portAuthority" |
    "port.etd.carrier" |
    "portAuthority.atc.vessel" |
    "portAuthority.ats.vessel" |
    "portBasin.ata.vessel" |
    "provision.atc.vessel" |
    "provision.ats.vessel" |
    "slops.atc.vessel" |
    "slops.ats.vessel" |
    "surveyor.ets.serviceProvider" |
    "surveyor.etc.serviceProvider" |
    "tender.atc.vessel" |
    "tender.ats.vessel" |
    "tugsStandby.et.portAuthority" |
    "tugsStandby.at.portAuthority" |
    "tugsNoMoreStandby.et.portAuthority" | 
    "tugsNoMoreStandby.at.portAuthority" |
    "vtsArea.ata.vessel" |
    "vtsArea.atd.vessel" |
    "waste.atc.vessel" |
    "waste.ats.vessel" |
    "waste.ets.serviceProvider" |
    "waste.etc.serviceProvider" |
    "waste.ats.serviceProvider" |
    "waste.atc.serviceProvider" |
    "waste.cancel.serviceProvider"

/** Specifies the type of location */
type EventLocationType =
    "anchorArea" |
    "approachArea" |
    "berth" |
    "fairway" |
    "pilotBoardingPlace" |
    "port" |
    "portBasin" |
    "terminal" |
    "tugArea"

/** Specifies the activity of the port call process*/
type PortActivity =
    "anchorArea" |
    "approachArea" |
    "barge" |
    "berth" |
    "bunkerPW" | // Bunkers Potable Water
    "bunkerService" |
    "cargoOperations" |
    "customs" |
    "distanceToPort" |
    "fairway" |
    "firstLineReleased" |
    "firstLineSecured" |
    "floatingCrane" |
    "immigration" |
    "lastLineReleased" |
    "lastLineSecured" |
    "pilotBoardingPlace" |
    "pilotDisembarked" |
    "pilotOnBoard" |
    "port" |
    "portAuthority " | // Different from the port authority party, this activity defines a port authority visit to the vessel
    "portBasin" |
    "provision" |
    "slops" |
    "surveyor" |
    "tender" |
    "vtsArea" |
    "waste"

/** Event time type
 * declare is a special type to allow meta-information without an event time
 * cancel is a special type to signify a cancelled activity
 */
type TimeType =
    "at" |
    "ata" |
    "atc" |
    "atd" |
    "ats" |
    "cancel" |
    "declare" |
    "et" |
    "eta" |
    "etc" |
    "etd" |
    "ets" |
    "pta" |
    "ptd" |
    "rta" |
    "rtd"

type EventParty =
    "agent" |
    "bunkerService" |
    "carrier" |
    "linesmen" |
    "pilot" |
    "predictor" | // A predicting party which isn't a nautical party
    "portAuthority" |
    "serviceProvider" |
    "terminal" |
    "tugService"
    
