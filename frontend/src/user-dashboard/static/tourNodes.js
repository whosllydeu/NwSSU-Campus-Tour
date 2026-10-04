
const CAT_TOUR_NODES = [
  {
    id: "building-1",
    panorama: "/panoramas/cat/cat-01.jpg",
    name: "Building Entrance",
    caption: "Building Entrance",
    links: [
      { nodeId: "building-2", position: { yaw: "0deg", pitch: "180deg" } },
    ],
  },
  {
    id: "building-2",
    panorama: "/panoramas/cat/cat-02.jpg",
    name: "Hallway",
    caption: "Hallway",
    links: [
      { nodeId: "building-1", position: { yaw: "180deg", pitch: "0deg" } },
      { nodeId: "building-3", position: { yaw: "0deg", pitch: "0deg" } },
    ],
  },
  {
    id: "building-3",
    panorama: "/panoramas/cat/cat-03.jpg",
    name: "Hallway",
    caption: "Hallway",
    links: [
      { nodeId: "building-2", position: { yaw: "-90deg", pitch: "0deg" } },
      { nodeId: "building-18", position: { yaw: "0deg", pitch: "0deg" } },
      { nodeId: "building-4", position: { yaw: "90deg", pitch: "0deg" } },
    ],
  },
  {
    id: "building-4",
    panorama: "/panoramas/cat/cat-04.jpg",
    name: "Hallway",
    caption: "Hallway",
    links: [
      { nodeId: "building-5", position: { yaw: "90deg", pitch: "0deg" } },
    ],
  },
  {
    id: "building-5",
    panorama: "/panoramas/cat/cat-05.jpg",
    name: "Hallway",
    caption: "Hallway",
    links: [
      { nodeId: "building-6", position: { yaw: "90deg", pitch: "0deg" } },
      { nodeId: "building-3", position: { yaw: "-90deg", pitch: "0deg" } },
    ],
  },
  {
    id: "building-6",
    panorama: "/panoramas/cat/cat-06.jpg",
    name: "Hallway",
    caption: "Hallway",
    links: [
      { nodeId: "building-7", position: { yaw: "90deg", pitch: "0deg" } },
      { nodeId: "building-5", position: { yaw: "-90deg", pitch: "0deg" } },
    ],
  },
  {
    id: "building-7",
    panorama: "/panoramas/cat/cat-07.jpg",
    name: "Hallway",
    caption: "Hallway",
    links: [
      { nodeId: "building-8", position: { yaw: "90deg", pitch: "0deg" } },
      { nodeId: "building-6", position: { yaw: "-90deg", pitch: "0deg" } },
    ],
  },
  {
    id: "building-8",
    panorama: "/panoramas/cat/cat-08.jpg",
    name: "Hallway",
    caption: "Hallway",
    links: [
      { nodeId: "building-9", position: { yaw: "90deg", pitch: "0deg" } },
      { nodeId: "building-7", position: { yaw: "-90deg", pitch: "0deg" } },
    ],
  },
  {
    id: "building-9",
    panorama: "/panoramas/cat/cat-09.jpg",
    name: "Hallway",
    caption: "Hallway",
    links: [
      { nodeId: "building-8", position: { yaw: "-90deg", pitch: "0deg" } },
      { nodeId: "building-10", position: { yaw: "0deg", pitch: "0deg" } },
    ],
  },
  {
    id: "building-10",
    panorama: "/panoramas/cat/cat-10.jpg",
    name: "Stairs",
    caption: "Stairs",
    links: [
      { nodeId: "building-9", position: { yaw: "-40deg", pitch: "0deg" } },
      { nodeId: "building-11", position: { yaw: "40deg", pitch: "0deg" } },
    ],
  },
  {
    id: "building-11",
    panorama: "/panoramas/cat/cat-11.jpg",
    name: "Stairs",
    caption: "Stairs",
    links: [
      { nodeId: "building-10", position: { yaw: "0deg", pitch: "0deg" } },
      { nodeId: "building-12", position: { yaw: "-90deg", pitch: "0deg" } },
    ],
  },
  {
    id: "building-12",
    panorama: "/panoramas/cat/cat-12.jpg",
    name: "Second floor Hallway",
    caption: "Second floor Hallway",
    links: [
      { nodeId: "building-11", position: { yaw: "90deg", pitch: "0deg" } },
      { nodeId: "building-13", position: { yaw: "-90deg", pitch: "0deg" } },
    ],
  },
  {
    id: "building-13",
    panorama: "/panoramas/cat/cat-13.jpg",
    name: "Second floor Hallway",
    caption: "Second floor Hallway",
    links: [
      { nodeId: "building-12", position: { yaw: "90deg", pitch: "0deg" } },
      { nodeId: "building-14", position: { yaw: "-90deg", pitch: "0deg" } },
    ],
  },
  {
    id: "building-14",
    panorama: "/panoramas/cat/cat-14.jpg",
    name: "Second floor Hallway",
    caption: "Second floor Hallway",
    links: [
      { nodeId: "building-13", position: { yaw: "-180deg", pitch: "0deg" } },
      { nodeId: "building-15", position: { yaw: "0deg", pitch: "0deg" } },
    ],
  },
  {
    id: "building-15",
    panorama: "/panoramas/cat/cat-15.jpg",
    name: "Second floor Hallway Forward",
    caption: "Second floor Hallway Forward",
    links: [
      { nodeId: "building-14", position: { yaw: "90deg", pitch: "0deg" } },
      { nodeId: "building-16", position: { yaw: "-90deg", pitch: "0deg" } },
    ],
  },
  {
    id: "building-16",
    panorama: "/panoramas/cat/cat-16.jpg",
    name: "Second floor Hallway",
    caption: "Second floor Hallway",
    links: [
      { nodeId: "building-15", position: { yaw: "90deg", pitch: "0deg" } },
      { nodeId: "building-17", position: { yaw: "-90deg", pitch: "0deg" } },
    ],
  },
  {
    id: "building-17",
    panorama: "/panoramas/cat/cat-17.jpg",
    name: "Second floor Hallway",
    caption: "Second floor Hallway",
    links: [
      { nodeId: "building-16", position: { yaw: "90deg", pitch: "0deg" } },
      { nodeId: "building-18", position: { yaw: "0deg", pitch: "0deg" } },
    ],
  },
  {
    id: "building-18",
    panorama: "/panoramas/cat/cat-18.jpg",
    name: "Stairs",
    caption: "Stairs",
    links: [
      { nodeId: "building-17", position: { yaw: "-40deg", pitch: "0deg" } },
      { nodeId: "building-3", position: { yaw: "40deg", pitch: "0deg" } },
    ],
  },
];

export const nwssuTourNodes = {
  cat: CAT_TOUR_NODES,
}