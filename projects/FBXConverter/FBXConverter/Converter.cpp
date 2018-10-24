#include "pch.h"
#include "Converter.h"

Converter::Converter() {
	_manager = FbxManager::Create();
	_manager->SetIOSettings(FbxIOSettings::Create(_manager, IOSROOT));

	printf("%s\n", _manager->GetVersion());
}

Converter::~Converter() {
	_manager->Destroy();
}

void Converter::parse(std::string filePath) {
	auto importer = FbxImporter::Create(_manager, "");
	if (importer->Initialize(filePath.c_str(), -1, _manager->GetIOSettings())) {
		if (importer->IsFBX()) {
			int major, minor, revision;
			importer->GetFileVersion(major, minor, revision);
			printf("FBX file format version for file '%s' is %d.%d.%d\n", filePath.c_str(), major, minor, revision);

			auto scene = FbxScene::Create(_manager, "My Scene");
			if (importer->Import(scene)) {
				importer->Destroy();

				FbxGeometryConverter c(_manager);
				c.Triangulate(scene, true);

				this->_parseNode(scene->GetRootNode());
			} else {
				printf("Import scene failed\n");
			}
		} else {
			printf("Import file failed : not a fbx file\n");
		}
	} else {
		printf("Import file failed : %s\n", importer->GetStatus().GetErrorString());
	}
}

void Converter::_parseNode(FbxNode* node) {
	auto attrib = node->GetNodeAttribute();
	if (attrib != nullptr) {
		switch (attrib->GetAttributeType()) {
		case FbxNodeAttribute::EType::eMesh:
			this->_parseMesh(node);
			break;
		case FbxNodeAttribute::EType::eSkeleton:
			this->_parseSkeleton(node);
			break;
		default:
			break;
		}
	}

	for (int i = 0, n = node->GetChildCount(); i < n; ++i) this->_parseNode(node->GetChild(i));
}

void Converter::_parseMesh(FbxNode* node) {
	auto mesh = node->GetMesh();
	if (mesh != nullptr) {
		printf("mesh\n");

		int numTris = mesh->GetPolygonCount();
		auto ctrlPoints = mesh->GetControlPoints();
		for (int i = 0; i < numTris; ++i) {
			for (int j = 0; j < 3; ++j) {
				int idx = mesh->GetPolygonVertex(i, j);
				this->_parseVertex(ctrlPoints, idx);

				idx = mesh->GetTextureUVIndex(i, j);
				auto uvs = mesh->GetElementUV();
				auto uv = uvs->GetDirectArray().GetAt(idx);
				printf("uv %d  %d  %d  %f  %f\n", i, j, idx, uv[0], uv[1]);
			}
		}
	}
}

void Converter::_parseVertex(FbxVector4* ctrlPoints, int index) {
	auto& v = ctrlPoints[index];
	float x = v.mData[0];
	float y = v.mData[1];
	float z = v.mData[2];

	//printf("p %f  %f  %f\n", x, y, z);
}

void Converter::_parseSkeleton(FbxNode* node) {
	printf("skeleton\n");
}